import dotenv from 'dotenv';
import { prisma } from '../lib/prisma.js';
import { coastyClient } from '../services/coasty/coasty.client.js';
import { coastyExecutionProvider } from '../services/coasty/coasty.provider.js';
import { WorkflowStatus, RunStatus } from '@prisma/client';

dotenv.config();

async function runSmokeTest() {
  console.log('====================================================');
  console.log('      ARISE — COASTY REAL COMPUTER-USE SMOKE TEST   ');
  console.log('====================================================\n');

  // Step 1: Verify API Key
  const apiKey = process.env.COASTY_API_KEY;
  if (!apiKey || apiKey.trim().length === 0) {
    console.error('❌ ERROR: COASTY_API_KEY environment variable is missing.');
    console.error('Please configure COASTY_API_KEY in backend/.env to execute live Coasty runs.');
    process.exit(1);
  }

  // Step 2: Verify Machine ID
  const machineId = process.env.COASTY_MACHINE_ID;
  if (!machineId || machineId.trim().length === 0) {
    console.error('❌ ERROR: COASTY_MACHINE_ID environment variable is missing.');
    console.error('Please configure COASTY_MACHINE_ID in backend/.env.');
    process.exit(1);
  }

  console.log('✓ Credentials & Machine ID configuration validated.');

  // Step 3: Verify API Connectivity
  console.log('Connecting to Coasty API endpoint...');
  const connTest = await coastyClient.testConnection();
  if (!connTest.success) {
    console.error(`❌ Connection test failed: ${connTest.message}`);
    process.exit(1);
  }
  console.log(`✓ Coasty API Connection verified (${connTest.latencyMs || 0}ms latency).\n`);

  // Step 4: Create Harmless Live Task (1-5 steps max)
  console.log('Creating harmless live smoke test task run (Max 5 steps)...');
  
  let workflow = await prisma.workflow.findFirst({ where: { category: 'Smoke Test' } });
  if (!workflow) {
    workflow = await prisma.workflow.create({
      data: {
        name: 'Coasty Live Integration Smoke Test',
        category: 'Smoke Test',
        triggerEvent: 'Smoke Test Command',
        autoApprovalThreshold: 1000,
        status: WorkflowStatus.ACTIVE,
        maxSteps: 5,
        timeoutSeconds: 120,
        description: 'Open a public webpage, inspect the screen, verify heading element, do not login, finish safely.'
      }
    });
  }

  const runCount = await prisma.agentRun.count();
  const runIdStr = `RUN-SMOKE-${Date.now()}`;

  const ariseRun = await prisma.agentRun.create({
    data: {
      runId: runIdStr,
      workflowId: workflow.id,
      status: RunStatus.QUEUED,
      totalSteps: 5,
    }
  });

  const idempotencyKey = `arise:${ariseRun.id}:coasty:smoke`;

  console.log(`Created ARISE AgentRun: ${ariseRun.runId} (${ariseRun.id})`);

  // Step 5: Dispatch to Coasty API
  try {
    await coastyExecutionProvider.startRun({
      runId: ariseRun.id,
      workflowId: workflow.id,
    });

    const updatedRun = await prisma.agentRun.findUnique({ where: { id: ariseRun.id } });
    console.log(`✓ Coasty Task Run Created! Coasty Run ID: ${updatedRun?.externalRunId}`);

    // Step 6: Wait for Terminal State
    console.log('Subscribing & polling for terminal run state...');

    let finalRun = updatedRun;
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 3000));
      attempts++;

      if (updatedRun?.externalRunId) {
        const statusRes = await coastyExecutionProvider.getRunStatus(ariseRun.id);
        console.log(`  [Attempt ${attempts}] Status: ${statusRes.status} | Steps: ${statusRes.currentStep}/${statusRes.totalSteps}`);

        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(statusRes.status)) {
          finalRun = await prisma.agentRun.findUnique({ where: { id: ariseRun.id } });
          break;
        }
      }
    }

    // Step 7: Print Final Summary
    console.log('\n====================================================');
    console.log('             LIVE SMOKE TEST RESULTS                ');
    console.log('====================================================');
    console.log(`ARISE Run ID:   ${finalRun?.runId}`);
    console.log(`Coasty Run ID:  ${finalRun?.externalRunId || 'N/A'}`);
    console.log(`Final Status:   ${finalRun?.status}`);
    console.log(`Steps Run:      ${finalRun?.currentStep} / ${finalRun?.totalSteps}`);
    console.log(`Duration:       ${finalRun?.durationMs ? `${finalRun.durationMs} ms` : 'Completed'}`);
    console.log(`Outcome/Error:  ${finalRun?.outcome || finalRun?.errorMessage || 'N/A'}`);
    console.log('====================================================\n');

    if (finalRun?.status === 'COMPLETED') {
      console.log('✅ SMOKE TEST PASSED SUCCESSFULLY!');
      process.exit(0);
    } else {
      console.error(`❌ SMOKE TEST FAILED with status: ${finalRun?.status}`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`❌ SMOKE TEST EXCEPTION: ${err?.message || err}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSmokeTest();
