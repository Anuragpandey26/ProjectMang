export class MessageDTO {
  constructor(message) {
    this.id = message._id;
    this.sender = message.sender;
    this.message = message.message;
    this.resourceType = message.resourceType;
    this.resourceId = message.resourceId;
    this.createdAt = message.createdAt;
  }
}

export class SendMessageDTO {
  constructor(resourceType, resourceId, message) {
    this.resourceType = resourceType;
    this.resourceId = resourceId;
    this.message = message;
  }
}
