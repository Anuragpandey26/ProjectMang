import Workspace from "../models/workspace.js";
import Project from "../../project/models/project.js";
import User from "../../auth/models/user.js";
import WorkspaceInvite from "../models/workspace-invite.js";
import jwt from "jsonwebtoken";
import { emailService } from "../../../adapters/email/index.js";
import activityLogService from "../../../services/activity-log.service.js";
import { AppError } from "../../../error-handlers/global.error-handler.js";

class WorkspaceService {
  /**
   * Create a new workspace
   */
  async createWorkspace(workspaceData, userId) {
    const { name, description, color } = workspaceData;
    return await Workspace.create({
      name,
      description,
      color,
      owner: userId,
      members: [
        {
          user: userId,
          role: "owner",
          joinedAt: new Date(),
        },
      ],
    });
  }

  /**
   * Get all workspaces for a user
   */
  async getWorkspaces(userId) {
    return await Workspace.find({
      "members.user": userId,
    }).sort({ createdAt: -1 });
  }

  /**
   * Get workspace details
   */
  async getWorkspaceDetails(workspaceId) {
    const workspace = await Workspace.findById(workspaceId).populate(
      "members.user",
      "name email profilePicture"
    );
    if (!workspace) throw new AppError("Workspace not found", 404);
    return workspace;
  }

  /**
   * Get projects within a workspace for a specific user
   */
  async getWorkspaceProjects(workspaceId, userId) {
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      "members.user": userId,
    }).populate("members.user", "name email profilePicture");

    if (!workspace) throw new AppError("Workspace not found", 404);

    const projects = await Project.find({
      workspace: workspaceId,
      isArchived: false,
      members: { $elemMatch: { user: userId } },
    })
      .populate("tasks", "status")
      .sort({ createdAt: -1 });

    return { projects, workspace };
  }

  /**
   * Calculate workspace statistics
   * This logic was heavily nested in the controller
   */
  async getWorkspaceStats(workspaceId, userId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError("Workspace not found", 404);

    const isMember = workspace.members.some(
      (member) => member.user.toString() === userId.toString()
    );
    if (!isMember) throw new AppError("You are not a member of this workspace", 403);

    const [totalProjects, projects] = await Promise.all([
      Project.countDocuments({ workspace: workspaceId }),
      Project.find({ workspace: workspaceId })
        .populate("tasks", "title status dueDate project updatedAt isArchived priority")
        .sort({ createdAt: -1 }),
    ]);

    const tasks = projects.flatMap((p) => p.tasks);
    const totalTasks = tasks.length;
    const totalProjectInProgress = projects.filter(p => p.status === "In Progress").length;
    const totalTaskCompleted = tasks.filter(t => t.status === "Done").length;
    const totalTaskToDo = tasks.filter(t => t.status === "To Do").length;
    const totalTaskInProgress = tasks.filter(t => t.status === "In Progress").length;

    const today = new Date();
    const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const upcomingTasks = tasks.filter(t => {
      const d = new Date(t.dueDate);
      return d > today && d <= next7Days;
    });

    // Trends and priority distribution logic moved from controller
    const taskTrendsData = this._calculateTaskTrends(projects);
    const projectStatusData = this._calculateProjectStatusDistribution(projects);
    const taskPriorityData = this._calculateTaskPriorityDistribution(tasks);
    const workspaceProductivityData = this._calculateProductivity(projects, tasks);

    return {
      stats: {
        totalProjects,
        totalTasks,
        totalProjectInProgress,
        totalTaskCompleted,
        totalTaskToDo,
        totalTaskInProgress,
      },
      taskTrendsData,
      projectStatusData,
      taskPriorityData,
      workspaceProductivityData,
      upcomingTasks,
      recentProjects: projects.slice(0, 5),
    };
  }

  /**
   * Invite user to workspace
   */
  async inviteUser(workspaceId, inviteData, inviterId) {
    const { email, role } = inviteData;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError("Workspace not found", 404);

    const inviter = workspace.members.find(m => m.user.toString() === inviterId.toString());
    if (!inviter || !["admin", "owner"].includes(inviter.role)) {
      throw new AppError("You are not authorized to invite members", 403);
    }

    const targetUser = await User.findOne({ email });
    if (!targetUser) throw new AppError("User not found", 404);

    const isAlreadyMember = workspace.members.some(m => m.user.toString() === targetUser._id.toString());
    if (isAlreadyMember) throw new AppError("User already a member", 400);

    const existingInvite = await WorkspaceInvite.findOne({ user: targetUser._id, workspaceId });
    if (existingInvite && existingInvite.expiresAt > new Date()) {
      throw new AppError("User already invited", 400);
    }

    if (existingInvite) await WorkspaceInvite.deleteOne({ _id: existingInvite._id });

    const inviteToken = jwt.sign(
      { user: targetUser._id, workspaceId, role: role || "member" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await WorkspaceInvite.create({
      user: targetUser._id,
      workspaceId,
      token: inviteToken,
      role: role || "member",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    const invitationLink = `${process.env.FRONTEND_URL}/workspace-invite/${workspace._id}?tk=${inviteToken}`;
    await emailService.sendCustomEmail(email, "Workspace Invitation", `<p>Join ${workspace.name}: <a href="${invitationLink}">${invitationLink}</a></p>`);

    return { message: "Invitation sent" };
  }

  /**
   * Accept invitation by token
   */
  async acceptInvite(token) {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { user, workspaceId, role } = decoded;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError("Workspace not found", 404);

    const isMember = workspace.members.some(m => m.user.toString() === user.toString());
    if (isMember) throw new AppError("Already a member", 400);

    const invite = await WorkspaceInvite.findOne({ user, workspaceId });
    if (!invite || invite.expiresAt < new Date()) throw new AppError("Invalid or expired invitation", 400);

    workspace.members.push({ user, role: role || "member", joinedAt: new Date() });
    await workspace.save();

    await Promise.all([
      WorkspaceInvite.deleteOne({ _id: invite._id }),
      activityLogService.recordActivity(user, "joined_workspace", "Workspace", workspaceId, { description: `Joined ${workspace.name}` })
    ]);

    return { message: "Joined successfully" };
  }

  // Helper calculation methods
  _calculateTaskTrends(projects) {
    const taskTrendsData = [
      { name: "Sun", completed: 0, inProgress: 0, toDo: 0 },
      { name: "Mon", completed: 0, inProgress: 0, toDo: 0 },
      { name: "Tue", completed: 0, inProgress: 0, toDo: 0 },
      { name: "Wed", completed: 0, inProgress: 0, toDo: 0 },
      { name: "Thu", completed: 0, inProgress: 0, toDo: 0 },
      { name: "Fri", completed: 0, inProgress: 0, toDo: 0 },
      { name: "Sat", completed: 0, inProgress: 0, toDo: 0 },
    ];

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    for (const project of projects) {
      if (!project.tasks) continue;
      for (const task of project.tasks) {
        const taskDate = new Date(task.updatedAt);
        const dayInDate = last7Days.findIndex(d => 
          d.getDate() === taskDate.getDate() && 
          d.getMonth() === taskDate.getMonth() && 
          d.getFullYear() === taskDate.getFullYear()
        );

        if (dayInDate !== -1) {
          const dayName = last7Days[dayInDate].toLocaleDateString("en-US", { weekday: "short" });
          const dayData = taskTrendsData.find(d => d.name === dayName);
          if (dayData) {
            if (task.status === "Done") dayData.completed++;
            else if (task.status === "In Progress") dayData.inProgress++;
            else if (task.status === "To Do") dayData.toDo++;
          }
        }
      }
    }
    return taskTrendsData;
  }

  _calculateProjectStatusDistribution(projects) {
    const data = [
      { name: "Completed", value: 0, color: "#10b981" },
      { name: "In Progress", value: 0, color: "#3b82f6" },
      { name: "Planning", value: 0, color: "#f59e0b" },
    ];
    projects.forEach(p => {
      if (p.status === "Completed") data[0].value++;
      else if (p.status === "In Progress") data[1].value++;
      else if (p.status === "Planning") data[2].value++;
    });
    return data;
  }

  _calculateTaskPriorityDistribution(tasks) {
    const data = [
      { name: "High", value: 0, color: "#ef4444" },
      { name: "Medium", value: 0, color: "#f59e0b" },
      { name: "Low", value: 0, color: "#6b7280" },
    ];
    tasks.forEach(t => {
      if (t.priority === "High") data[0].value++;
      else if (t.priority === "Medium") data[1].value++;
      else if (t.priority === "Low") data[2].value++;
    });
    return data;
  }

  _calculateProductivity(projects, tasks) {
    return projects.map(p => {
      const pTasks = tasks.filter(t => t.project.toString() === p._id.toString());
      const completed = pTasks.filter(t => t.status === "Done" && !t.isArchived).length;
      return { name: p.title, completed, total: pTasks.length };
    });
  }

  /**
   * Directly join a workspace or accept a generated invite link
   */
  async acceptInviteByWorkspaceId(workspaceId, userId) {
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) throw new AppError("Workspace not found", 404);

    const isMember = workspace.members.some(m => m.user.toString() === userId.toString());
    if (isMember) throw new AppError("Already a member", 400);

    workspace.members.push({ user: userId, role: "member", joinedAt: new Date() });
    await workspace.save();

    await activityLogService.recordActivity(userId, "joined_workspace", "Workspace", workspaceId, { 
        description: `Joined ${workspace.name}` 
    });

    return { message: "Joined successfully" };
  }

  /**
   * Cleanup invitations older than 48 hours
   */
  async cleanupOldInvitations() {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const result = await WorkspaceInvite.deleteMany({
      createdAt: { $lt: fortyEightHoursAgo },
    });
    return result.deletedCount;
  }
}

export default new WorkspaceService();
