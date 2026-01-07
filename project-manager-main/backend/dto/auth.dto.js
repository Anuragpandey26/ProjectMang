export class RegisterDTO {
  constructor(name, email, password) {
    this.name = name;
    this.email = email;
    this.password = password;
  }
}

export class LoginDTO {
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }
}

export class UserResponseDTO {
  constructor(user) {
    this.id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.isEmailVerified = user.isEmailVerified;
    this.lastLogin = user.lastLogin;
    this.createdAt = user.createdAt;
  }
}

export class AuthResponseDTO {
  constructor(message, token, user) {
    this.message = message;
    this.token = token;
    this.user = user ? new UserResponseDTO(user) : undefined;
  }
}
