const Workflow = require('./workflow.model');
const WorkflowInstance = require('./workflow.instance.model');
const WorkflowEngine = require('./workflow.engine');

async function createWorkflow(payload) {
  const doc = new Workflow(payload);
  return doc.save();
}

async function listWorkflows({ limit = 20, skip = 0, active } = {}) {
  const filter = {};
  if (typeof active === 'boolean') filter.active = active;
  return Workflow.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function getWorkflow(id) {
  return Workflow.findById(id);
}

async function updateWorkflow(id, payload) {
  return Workflow.findByIdAndUpdate(id, payload, { new: true });
}

async function deleteWorkflow(id) {
  return Workflow.findByIdAndDelete(id);
}

async function executeWorkflow(id, input) {
  const workflow = await getWorkflow(id);
  if (!workflow || !workflow.active) throw new Error('Workflow not found or inactive');

  // Simple execution: just return steps for now
  return { workflow: workflow.name, steps: workflow.steps, input };
}

// Instance operations
async function createWorkflowInstance(workflowId, data = {}, createdBy) {
  const workflow = await getWorkflow(workflowId);
  if (!workflow || !workflow.active) throw new Error('Workflow not found or inactive');

  const engine = new WorkflowEngine(workflow);
  const instanceData = engine.initializeInstance(data);
  instanceData.createdBy = createdBy;

  const instance = new WorkflowInstance(instanceData);
  return instance.save();
}

async function getWorkflowInstance(id) {
  return WorkflowInstance.findById(id).populate('workflowId');
}

async function listWorkflowInstances({ workflowId, status, limit = 20, skip = 0 } = {}) {
  const filter = {};
  if (workflowId) filter.workflowId = workflowId;
  if (status) filter.status = status;
  return WorkflowInstance.find(filter).populate('workflowId').sort({ createdAt: -1 }).skip(skip).limit(limit);
}

async function approveWorkflowInstance(instanceId, userId, data = {}) {
  const instance = await WorkflowInstance.findById(instanceId);
  if (!instance) throw new Error('Workflow instance not found');

  const workflow = await getWorkflow(instance.workflowId);
  const engine = new WorkflowEngine(workflow);

  const updatedInstance = engine.executeStep(instance, 'approve', userId, data);
  return WorkflowInstance.findByIdAndUpdate(instanceId, updatedInstance, { new: true });
}

async function rejectWorkflowInstance(instanceId, userId, data = {}) {
  const instance = await WorkflowInstance.findById(instanceId);
  if (!instance) throw new Error('Workflow instance not found');

  const workflow = await getWorkflow(instance.workflowId);
  const engine = new WorkflowEngine(workflow);

  const updatedInstance = engine.executeStep(instance, 'reject', userId, data);
  return WorkflowInstance.findByIdAndUpdate(instanceId, updatedInstance, { new: true });
}

async function getPendingApprovals(userId) {
  // Find instances where user is an approver for the current step
  return WorkflowInstance.find({
    status: { $in: ['pending', 'in_progress'] },
    $expr: {
      $in: [userId, {
        $let: {
          vars: { currentStep: { $arrayElemAt: ['$workflowId.steps', '$currentStep'] } },
          in: '$$currentStep.approvers'
        }
      }]
    }
  }).populate('workflowId');
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