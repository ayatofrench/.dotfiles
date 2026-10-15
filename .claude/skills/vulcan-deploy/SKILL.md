---
name: vulcan-deploy
description: Deploy the current test branch with smoke verification and rollback. Use when the user explicitly invokes /vulcan-deploy; do not invoke automatically.
disable-model-invocation: true
user-invocable: true
argument-hint: "[smoke-test instructions]"
---

Run these steps in order. Create a todo item for each step before you start so that no step is missed.

1. Identify and record the tag currently deployed to the test environment. This tag is the rollback target.

2. Create the required live smoke-test stories from these known-good configuration baselines:
   - Standalone: AB#527683.
   - Two-Story Convoy: root AB#527684 with child AB#527685 as the predecessor of child AB#527686. The Convoy root is now a **Feature**, not an Epic: create the root as a Feature with the baseline's other fields, and keep the children as User Stories.

   Preserve the baseline work-item types (except the root's type, above), `Catalyst\\Vulcan` area, `Catalyst` iteration, model and effort overrides, relevant smoke-identification tags, parent-child links, and A-to-B predecessor/successor link. Keep the `convoy-group` discriminator tag on the Feature root; the webhook treats an untagged Feature as an inert container. Do not copy `convoy-group:*` lifecycle tags (for example the baseline's stale `convoy-group:in-progress`) or the historical `shipyard` tag; this repository does not configure a trigger tag. Use new unique marker filenames and contents. Keep every Story description and acceptance criteria limited to its smoke-fixture implementation. Keep the Feature description limited to delivering the ordered child changes. Do not copy release, deployment, activation, or orchestration instructions into those fields because Vulcan can interpret them as implementation work.

   Before creating the Feature root, read the resolved Feature board lifecycle in `shipyard.yaml` on the test branch and confirm its trigger state exists on the live Feature type. Prepare all items in `New` without activating them. Apply these additional smoke-test instructions if supplied: $ARGUMENTS. If no instructions are supplied, create the standard standalone and two-Story Convoy smoke tests.

3. Create and push the next test version tag from the current intended commit on the test branch. The tag must trigger the deployment. Do not move or replace an existing tag.

4. Wait for every required deployment pipeline and component to complete. Confirm that the test environment is healthy before you activate any smoke-test story.

5. Activate and run the live smoke tests in the established order. First move the standalone Story from `New` to `Ready for Dev` and confirm its result. Only then move the Convoy Feature from `New` to its configured trigger state (resolved from `board` and `board.types.feature` in `shipyard.yaml`, currently the base `Ready for Dev`; `Technical Planned` is retired); its child Stories remain governed by the Convoy. Confirm the Feature ends `awaiting-review` with its Convoy lease released and the `convoy-group:claimed` tag removed; the parent board state stays `In Progress` under manual merge, as the prior Epic Convoy did, while each child Story reaches `Dev Review`. Confirm each Story's PR, CI outcome, handoff status, actual board state, and lease release. Do not treat `awaiting-review` alone as proof of success.

6. If any smoke test shows a regression, stop any remaining smoke tests, redeploy the rollback tag recorded in step 1, and confirm that the rollback completed. Otherwise, report the deployment as successful.

Report the created smoke-test stories, recorded rollback tag, candidate tag, deployment evidence, smoke-test results, and final environment state.
