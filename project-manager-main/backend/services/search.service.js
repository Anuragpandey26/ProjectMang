import Task from "../modules/task/models/task.js";
import Project from "../modules/project/models/project.js";

/**
 * Search Service
 * Provides high-speed, fuzzy full-text search across Tasks and Projects
 */
class SearchService {
  /**
   * Search Tasks with fuzzy matching and security check
   */
  async searchTasks(query, userId) {
    if (!query) return [];

    // Aggregate Tasks using Atlas Search ($search) 
    // This assumes a Search Index named 'default' with 'title' and 'description' mapped
    return await Task.aggregate([
      {
        $search: {
          index: "default",
          compound: {
            must: [
              {
                text: {
                  query: query,
                  path: ["title", "description"],
                  fuzzy: { maxEdits: 2 }, // Up to 2 typos allowed
                },
              },
            ],
          },
        },
      },
      {
        // Security check: Only return tasks for projects the user belongs to
        $lookup: {
          from: "projects",
          localField: "project",
          foreignField: "_id",
          as: "projectDetails",
        },
      },
      { $unwind: "$projectDetails" },
      {
        $match: {
          "projectDetails.members.user": userId,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          status: 1,
          priority: 1,
          score: { $meta: "searchScore" },
          resourceType: { $literal: "Task" },
        },
      },
    ]);
  }

  /**
   * Search Projects with fuzzy matching
   */
  async searchProjects(query, userId) {
    if (!query) return [];

    return await Project.aggregate([
      {
        $search: {
          index: "default",
          text: {
            query: query,
            path: ["title", "description"],
            fuzzy: { maxEdits: 1 },
          },
        },
      },
      {
        // Security Check: Only projects I'm a member of
        $match: {
          "members.user": userId,
        },
      },
      {
        $limit: 10,
      },
      {
        $project: {
          _id: 1,
          title: 1,
          status: 1,
          score: { $meta: "searchScore" },
          resourceType: { $literal: "Project" },
        },
      },
    ]);
  }

  /**
   * Unified Search across all resources
   */
  async unifiedSearch(query, userId) {
    const [tasks, projects] = await Promise.all([
      this.searchTasks(query, userId),
      this.searchProjects(query, userId),
    ]);

    // Combine and sort by relevance score
    return [...tasks, ...projects].sort((a, b) => b.score - a.score);
  }
}

export default new SearchService();
