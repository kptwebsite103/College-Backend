class WorkflowEngine {
  constructor(workflowDefinition) {
    this.definition = workflowDefinition;
    this.steps = workflowDefinition.steps || [];
  }

  // Initialize a new workflow instance
  initializeInstance(data = {}) {
    return {
      workflowId: this.definition._id,
      currentStep: 0,
      status: 'pending',
      data,
      approvals: [],
      history: [{
        action: 'initialized',
        timestamp: new Date(),
        data
      }]
    };
  }

  // Execute the next step
  async executeStep(instance, action, userId, data = {}) {
    const currentStepDef = this.steps[instance.currentStep];
    if (!currentStepDef) {
      throw new Error('No more steps to execute');
    }

    if (currentStepDef.type === 'approval') {
      return this.handleApprovalStep(instance, currentStepDef, action, userId, data);
    }

    // For other step types, advance automatically
    instance.currentStep++;
    instance.history.push({
      action: 'step_completed',
      step: instance.currentStep - 1,
      timestamp: new Date(),
      data
    });

    if (instance.currentStep >= this.steps.length) {
      instance.status = 'completed';
    }

    return instance;
  }

  // Handle approval step
  handleApprovalStep(instance, stepDef, action, userId, data) {
    const { approvers = [], requiredApprovals = 1 } = stepDef;

    if (!approvers.includes(userId)) {
      throw new Error('User not authorized to approve this step');
    }

    // Check if already approved by this user
    const existingApproval = instance.approvals.find(a => a.step === instance.currentStep && a.userId === userId);
    if (existingApproval) {
      throw new Error('User has already voted on this step');
    }

    // Record the approval/rejection
    instance.approvals.push({
      step: instance.currentStep,
      userId,
      action, // 'approve' or 'reject'
      timestamp: new Date(),
      data
    });

    instance.history.push({
      action,
      step: instance.currentStep,
      userId,
      timestamp: new Date(),
      data
    });

    // Check if step is complete
    const stepApprovals = instance.approvals.filter(a => a.step === instance.currentStep);
    const approveCount = stepApprovals.filter(a => a.action === 'approve').length;
    const rejectCount = stepApprovals.filter(a => a.action === 'reject').length;

    if (rejectCount > 0) {
      // Any rejection fails the step
      instance.status = 'rejected';
      instance.currentStep = this.steps.length; // End workflow
    } else if (approveCount >= requiredApprovals) {
      // Enough approvals, advance
      instance.currentStep++;
      if (instance.currentStep >= this.steps.length) {
        instance.status = 'approved';
      } else {
        instance.status = 'in_progress';
      }
    }

    return instance;
  }

  // Get current step info
  getCurrentStep(instance) {
    if (instance.currentStep >= this.steps.length) {
      return null;
    }
    return this.steps[instance.currentStep];
  }

  // Check if workflow is complete
  isComplete(instance) {
    return instance.status === 'approved' || instance.status === 'rejected' || instance.status === 'completed';
  }
}

module.exports = WorkflowEngine;