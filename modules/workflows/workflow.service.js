const { query } = require('../../config/database');
const { buildUpdate, generateId, parseDate, parseJson, toBool, toJson, withId } = require('../../utils/mysql-utils');
const WorkflowEngine = require('./workflow.engine');

function mapWorkflow(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    name: row.name,
    description: row.description || null,
    steps: parseJson(row.steps, []),
    active: toBool(row.active, true),
    createdBy: row.createdBy || null,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

function mapWorkflowInstance(row) {
  if (!row) return null;
  return withId({
    _id: row._id,
    workflowId: row.workflowId,
    currentStep: Number(row.currentStep || 0),
    status: row.status || 'pending',
    data: parseJson(row.data, {}),
    approvals: parseJson(row.approvals, []),
    history: parseJson(row.history, []),
    createdBy: row.createdBy || null,
    createdAt: parseDate(row.createdAt),
    updatedAt: parseDate(row.updatedAt),
  });
}

async function getWorkflowsByIds(ids) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await query(`SELECT * FROM workflows WHERE _id IN (${placeholders})`, ids);
  return rows.map(mapWorkflow);
}

async function populateWorkflow(instances) {
  if (!instances.length) return instances;
  const workflowIds = Array.from(new Set(instances.map((i) => i.workflowId).filter(Boolean)));
  const workflows = await getWorkflowsByIds(workflowIds);
  const byId = new Map(workflows.map((w) => [w._id, w]));
  return instances.map((instance) => ({
    ...instance,
    workflowId: byId.get(instance.workflowId) || instance.workflowId,
  }));
}

async function createWorkflow(payload) {
  const _id = generateId();
  const now = new Date();
  await query(
    `INSERT INTO workflows (_id, name, description, steps, active, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      payload.name,
      payload.description || null,
      toJson(payload.steps || []),
      payload.active === false ? 0 : 1,
      payload.createdBy || null,
      now,
      now,
    ],
  );
  return getWorkflow(_id);
}

async function listWorkflows({ limit = 20, skip = 0, active } = {}) {
  const where = [];
  const values = [];
  if (typeof active === 'boolean') {
    where.push('active = ?');
    values.push(active ? 1 : 0);
  }
  values.push(Number(limit) || 20, Number(skip) || 0);
  const rows = await query(
    `SELECT * FROM workflows
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );
  return rows.map(mapWorkflow);
}

async function getWorkflow(id) {
  const rows = await query('SELECT * FROM workflows WHERE _id = ? LIMIT 1', [id]);
  return mapWorkflow(rows[0]);
}

async function updateWorkflow(id, payload) {
  const source = {
    ...payload,
    steps: Object.prototype.hasOwnProperty.call(payload, 'steps') ? toJson(payload.steps || []) : undefined,
    active: Object.prototype.hasOwnProperty.call(payload, 'active') ? (payload.active ? 1 : 0) : undefined,
    updatedAt: new Date(),
  };

  const { set, values } = buildUpdate(
    source,
    ['name', 'description', 'steps', 'active', 'updatedAt'],
  );

  if (set.length) {
    await query(`UPDATE workflows SET ${set.join(', ')} WHERE _id = ?`, [...values, id]);
  }
  return getWorkflow(id);
}

async function deleteWorkflow(id) {
  const doc = await getWorkflow(id);
  if (!doc) return null;
  await query('DELETE FROM workflows WHERE _id = ?', [id]);
  return doc;
}

async function executeWorkflow(id, input) {
  const workflow = await getWorkflow(id);
  if (!workflow || !workflow.active) throw new Error('Workflow not found or inactive');
  return { workflow: workflow.name, steps: workflow.steps, input };
}

async function createWorkflowInstance(workflowId, data = {}, createdBy) {
  const workflow = await getWorkflow(workflowId);
  if (!workflow || !workflow.active) throw new Error('Workflow not found or inactive');

  const engine = new WorkflowEngine(workflow);
  const instanceData = engine.initializeInstance(data);
  instanceData.createdBy = createdBy;

  const _id = generateId();
  const now = new Date();

  await query(
    `INSERT INTO workflow_instances
      (_id, workflowId, currentStep, status, data, approvals, history, createdBy, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      _id,
      String(instanceData.workflowId),
      Number(instanceData.currentStep || 0),
      instanceData.status || 'pending',
      toJson(instanceData.data || {}),
      toJson(instanceData.approvals || []),
      toJson(instanceData.history || []),
      instanceData.createdBy || null,
      now,
      now,
    ],
  );

  return getWorkflowInstance(_id);
}

async function getWorkflowInstance(id) {
  const rows = await query('SELECT * FROM workflow_instances WHERE _id = ? LIMIT 1', [id]);
  const instance = mapWorkflowInstance(rows[0]);
  if (!instance) return null;
  const [populated] = await populateWorkflow([instance]);
  return populated;
}

async function listWorkflowInstances({ workflowId, status, limit = 20, skip = 0 } = {}) {
  const where = [];
  const values = [];
  if (workflowId) {
    where.push('workflowId = ?');
    values.push(workflowId);
  }
  if (status) {
    where.push('status = ?');
    values.push(status);
  }
  values.push(Number(limit) || 20, Number(skip) || 0);
  const rows = await query(
    `SELECT * FROM workflow_instances
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY createdAt DESC
     LIMIT ? OFFSET ?`,
    values,
  );
  return populateWorkflow(rows.map(mapWorkflowInstance));
}

async function saveWorkflowInstance(instanceId, instanceData) {
  await query(
    `UPDATE workflow_instances
     SET workflowId = ?, currentStep = ?, status = ?, data = ?, approvals = ?, history = ?, createdBy = ?, updatedAt = ?
     WHERE _id = ?`,
    [
      typeof instanceData.workflowId === 'object' ? instanceData.workflowId._id : instanceData.workflowId,
      Number(instanceData.currentStep || 0),
      instanceData.status || 'pending',
      toJson(instanceData.data || {}),
      toJson(instanceData.approvals || []),
      toJson(instanceData.history || []),
      instanceData.createdBy || null,
      new Date(),
      instanceId,
    ],
  );
  return getWorkflowInstance(instanceId);
}

async function getWorkflowInstanceRaw(id) {
  const rows = await query('SELECT * FROM workflow_instances WHERE _id = ? LIMIT 1', [id]);
  return mapWorkflowInstance(rows[0]);
}

async function approveWorkflowInstance(instanceId, userId, data = {}) {
  const instance = await getWorkflowInstanceRaw(instanceId);
  if (!instance) throw new Error('Workflow instance not found');

  const workflow = await getWorkflow(instance.workflowId);
  const engine = new WorkflowEngine(workflow);
  const updatedInstance = engine.executeStep(instance, 'approve', userId, data);

  return saveWorkflowInstance(instanceId, updatedInstance);
}

async function rejectWorkflowInstance(instanceId, userId, data = {}) {
  const instance = await getWorkflowInstanceRaw(instanceId);
  if (!instance) throw new Error('Workflow instance not found');

  const workflow = await getWorkflow(instance.workflowId);
  const engine = new WorkflowEngine(workflow);
  const updatedInstance = engine.executeStep(instance, 'reject', userId, data);

  return saveWorkflowInstance(instanceId, updatedInstance);
}

async function getPendingApprovals(userId) {
  const rows = await query(
    `SELECT * FROM workflow_instances
     WHERE status IN ('pending', 'in_progress')
     ORDER BY createdAt DESC`,
  );

  const instances = rows.map(mapWorkflowInstance);
  const populated = await populateWorkflow(instances);

  return populated.filter((instance) => {
    const workflow = instance.workflowId && typeof instance.workflowId === 'object' ? instance.workflowId : null;
    if (!workflow) return false;
    const steps = Array.isArray(workflow.steps) ? workflow.steps : [];
    const currentStep = steps[instance.currentStep];
    const approvers = currentStep && Array.isArray(currentStep.approvers) ? currentStep.approvers : [];
    return approvers.includes(userId);
  });
}

module.exports = {
  createWorkflow,
  listWorkflows,
  getWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  createWorkflowInstance,
  getWorkflowInstance,
  listWorkflowInstances,
  approveWorkflowInstance,
  rejectWorkflowInstance,
  getPendingApprovals
};
