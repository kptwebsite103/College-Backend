const {
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
} = require('./workflow.service');
const { createSchema, updateSchema, listSchema, executeSchema } = require('./workflow.validation');

async function create(req, res) {
  const { error, value } = createSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const payload = { ...value, createdBy: req.user.id };
  const doc = await createWorkflow(payload);
  res.status(201).json(doc);
}

async function list(req, res) {
  const { error, value } = listSchema.validate(req.query);
  if (error) return res.status(400).json({ message: error.message });

  const docs = await listWorkflows(value);
  res.json(docs);
}

async function getById(req, res) {
  const doc = await getWorkflow(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function update(req, res) {
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const doc = await updateWorkflow(req.params.id, value);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  res.json(doc);
}

async function remove(req, res) {
  await deleteWorkflow(req.params.id);
  res.status(204).end();
}

async function execute(req, res) {
  const { error, value } = executeSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  try {
    const result = await executeWorkflow(req.params.id, value.input);
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// Instance controllers
async function createInstance(req, res) {
  const { workflowId, data } = req.body;
  if (!workflowId) return res.status(400).json({ message: 'workflowId is required' });

  try {
    const instance = await createWorkflowInstance(workflowId, data, req.user.id);
    res.status(201).json(instance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function getInstanceById(req, res) {
  const instance = await getWorkflowInstance(req.params.id);
  if (!instance) return res.status(404).json({ message: 'Not found' });
  res.json(instance);
}

async function listInstances(req, res) {
  const { workflowId, status, limit, skip } = req.query;
  const instances = await listWorkflowInstances({ workflowId, status, limit: parseInt(limit), skip: parseInt(skip) });
  res.json(instances);
}

async function approveInstance(req, res) {
  try {
    const instance = await approveWorkflowInstance(req.params.id, req.user.id, req.body);
    res.json(instance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function rejectInstance(req, res) {
  try {
    const instance = await rejectWorkflowInstance(req.params.id, req.user.id, req.body);
    res.json(instance);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function getMyPendingApprovals(req, res) {
  const approvals = await getPendingApprovals(req.user.id);
  res.json(approvals);
}

module.exports = {
  create,
  list,
  getById,
  update,
  remove,
  execute,
  createInstance,
  getInstanceById,
  listInstances,
  approveInstance,
  rejectInstance,
  getMyPendingApprovals
};