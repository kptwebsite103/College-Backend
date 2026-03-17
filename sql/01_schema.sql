CREATE TABLE IF NOT EXISTS users (
  _id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(120) NOT NULL UNIQUE,
  email VARCHAR(190) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(120) NULL,
  lastName VARCHAR(120) NULL,
  roles JSON NOT NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  departmentId VARCHAR(64) NULL,
  lastLogin DATETIME NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  _id VARCHAR(64) PRIMARY KEY,
  name JSON NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  description JSON NULL,
  faculty JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  order_no INT NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_departments_active_order (active, order_no, createdAt)
);

CREATE TABLE IF NOT EXISTS themes (
  _id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(80) NOT NULL UNIQUE,
  colors JSON NULL,
  contact JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_themes_active (active)
);

CREATE TABLE IF NOT EXISTS pages (
  _id VARCHAR(64) PRIMARY KEY,
  title JSON NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  redirect_url TEXT NULL,
  css LONGTEXT NULL,
  content JSON NOT NULL,
  status VARCHAR(50) NOT NULL,
  departmentId VARCHAR(64) NULL,
  author VARCHAR(64) NULL,
  updatedBy VARCHAR(64) NULL,
  publishedAt DATETIME NULL,
  scheduledAt DATETIME NULL,
  versions JSON NULL,
  tags JSON NULL,
  announcement JSON NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_pages_status (status),
  INDEX idx_pages_department (departmentId),
  INDEX idx_pages_scheduled (scheduledAt)
);

CREATE TABLE IF NOT EXISTS menus (
  _id VARCHAR(64) PRIMARY KEY,
  name JSON NOT NULL,
  slug VARCHAR(191) NOT NULL UNIQUE,
  type VARCHAR(40) NOT NULL DEFAULT 'navigation',
  url TEXT NULL,
  redirect_url TEXT NULL,
  items JSON NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'Created',
  active TINYINT(1) NOT NULL DEFAULT 1,
  order_no INT NOT NULL DEFAULT 0,
  departmentId VARCHAR(64) NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_menus_type_active (type, active),
  INDEX idx_menus_status (status)
);

CREATE TABLE IF NOT EXISTS home_sections (
  _id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(40) NOT NULL,
  title JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  order_no INT NOT NULL DEFAULT 0,
  departmentId VARCHAR(64) NULL,
  heroHeading JSON NULL,
  heroDescription JSON NULL,
  heroHeadingSize INT NULL,
  heroTextAlign VARCHAR(20) NULL,
  bannerImage TEXT NULL,
  bannerDescription JSON NULL,
  bannerLink TEXT NULL,
  slides JSON NULL,
  blockContent JSON NULL,
  pageSlug VARCHAR(191) NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_home_sections_type_active (type, active),
  INDEX idx_home_sections_department (departmentId)
);

CREATE TABLE IF NOT EXISTS media (
  _id VARCHAR(64) PRIMARY KEY,
  url TEXT NOT NULL,
  public_id VARCHAR(255) NULL,
  title VARCHAR(255) NULL,
  filename VARCHAR(255) NULL,
  thumbnailUrl TEXT NULL,
  format VARCHAR(120) NULL,
  size BIGINT NULL,
  type VARCHAR(50) NULL,
  metadata JSON NULL,
  tags JSON NULL,
  uploadedBy VARCHAR(64) NULL,
  departmentId VARCHAR(64) NULL,
  usageRefs JSON NULL,
  localPath TEXT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'local',
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_media_status (status),
  INDEX idx_media_uploaded_by (uploadedBy),
  INDEX idx_media_department (departmentId)
);

CREATE TABLE IF NOT EXISTS notifications (
  _id VARCHAR(64) PRIMARY KEY,
  userId VARCHAR(64) NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(60) NOT NULL DEFAULT 'info',
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  data JSON NULL,
  recipients JSON NULL,
  status VARCHAR(40) NULL,
  error TEXT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_notifications_user_read (userId, `read`),
  INDEX idx_notifications_status (status)
);

CREATE TABLE IF NOT EXISTS analytics (
  _id VARCHAR(64) PRIMARY KEY,
  event VARCHAR(120) NOT NULL,
  data JSON NULL,
  userId VARCHAR(64) NULL,
  sessionId VARCHAR(120) NULL,
  ip VARCHAR(120) NULL,
  userAgent TEXT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_analytics_event (event),
  INDEX idx_analytics_user (userId),
  INDEX idx_analytics_session (sessionId),
  INDEX idx_analytics_created (createdAt)
);

CREATE TABLE IF NOT EXISTS activities (
  _id VARCHAR(64) PRIMARY KEY,
  actorId VARCHAR(64) NULL,
  actorEmail VARCHAR(190) NULL,
  action VARCHAR(80) NOT NULL,
  resourceType VARCHAR(80) NOT NULL,
  resourceId VARCHAR(64) NULL,
  beforeData JSON NULL,
  afterData JSON NULL,
  meta JSON NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_activities_actor (actorId),
  INDEX idx_activities_action (action),
  INDEX idx_activities_resource (resourceType, resourceId),
  INDEX idx_activities_created (createdAt)
);

CREATE TABLE IF NOT EXISTS webhooks (
  _id VARCHAR(64) PRIMARY KEY,
  source VARCHAR(120) NOT NULL,
  event VARCHAR(190) NOT NULL,
  payload JSON NOT NULL,
  headers JSON NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  processedAt DATETIME NULL,
  error TEXT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_webhooks_source (source),
  INDEX idx_webhooks_processed (processed),
  INDEX idx_webhooks_created (createdAt)
);

CREATE TABLE IF NOT EXISTS workflows (
  _id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  description TEXT NULL,
  steps JSON NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  createdBy VARCHAR(64) NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_workflows_active (active)
);

CREATE TABLE IF NOT EXISTS workflow_instances (
  _id VARCHAR(64) PRIMARY KEY,
  workflowId VARCHAR(64) NOT NULL,
  currentStep INT NOT NULL DEFAULT 0,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  data JSON NULL,
  approvals JSON NULL,
  history JSON NULL,
  createdBy VARCHAR(64) NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_workflow_instances_workflow (workflowId),
  INDEX idx_workflow_instances_status (status),
  INDEX idx_workflow_instances_created (createdAt)
);

CREATE TABLE IF NOT EXISTS backups (
  _id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(191) NOT NULL,
  path TEXT NULL,
  filePath TEXT NULL,
  size BIGINT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'pending',
  createdBy VARCHAR(64) NULL,
  type VARCHAR(80) NULL,
  error TEXT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_backups_status (status),
  INDEX idx_backups_created (createdAt)
);

CREATE TABLE IF NOT EXISTS clerk_webhooks (
  _id VARCHAR(64) PRIMARY KEY,
  eventType VARCHAR(120) NOT NULL,
  data JSON NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_clerk_webhooks_event (eventType),
  INDEX idx_clerk_webhooks_processed (processed)
);
