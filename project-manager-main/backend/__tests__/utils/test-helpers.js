import { jest } from "@jest/globals";

/**
 * Create a mock Express request object
 */
export const mockRequest = (data = {}) => {
  return {
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    user: data.user || null,
    ...data,
  };
};

/**
 * Create a mock Express response object
 */
export const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.writeHead = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
};

/**
 * Create a mock next function
 */
export const mockNext = () => jest.fn();

/**
 * Create a mock user object
 */
export const mockUser = (overrides = {}) => ({
  _id: "user123",
  name: "Test User",
  email: "test@example.com",
  password: "$2b$10$hashedpassword",
  isEmailVerified: true,
  lastLogin: new Date(),
  createdAt: new Date(),
  save: jest.fn().mockResolvedValue(true),
  toObject: jest.fn().mockReturnValue({
    _id: "user123",
    name: "Test User",
    email: "test@example.com",
    isEmailVerified: true,
  }),
  ...overrides,
});

/**
 * Create a mock task object
 */
export const mockTask = (overrides = {}) => ({
  _id: "task123",
  title: "Test Task",
  description: "Test Description",
  status: "To Do",
  priority: "Medium",
  dueDate: new Date(),
  assignees: ["user123"],
  project: "project123",
  createdBy: "user123",
  watchers: [],
  isAchieved: false,
  subTasks: [],
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Create a mock project object
 */
export const mockProject = (overrides = {}) => ({
  _id: "project123",
  title: "Test Project",
  description: "Test Description",
  status: "In Progress",
  startDate: new Date(),
  workspace: "workspace123",
  createdBy: "user123",
  members: [],
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Create a mock workspace object
 */
export const mockWorkspace = (overrides = {}) => ({
  _id: "workspace123",
  name: "Test Workspace",
  description: "Test Description",
  color: "#FF5733",
  owner: "user123",
  members: [
    {
      user: "user123",
      role: "admin",
    },
  ],
  save: jest.fn().mockResolvedValue(true),
  ...overrides,
});

/**
 * Wait for async operations
 */
export const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Generate a mock JWT token
 */
export const generateMockToken = (payload = {}) => {
  return `mock.jwt.token.${JSON.stringify(payload)}`;
};

/**
 * Create mock MongoDB ObjectId
 */
export const mockObjectId = (id = "123456789012345678901234") => id;
