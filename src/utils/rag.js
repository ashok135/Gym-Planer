// -------------------------------------------------------------
// HELPER: Difference tracking between old and new state
// -------------------------------------------------------------
const getChangedKeys = (beforeMap = {}, afterMap = {}) => {
  const changed = [];
  for (const [key, afterVal] of Object.entries(afterMap)) {
    const beforeVal = beforeMap[key];
    if (!beforeVal || JSON.stringify(beforeVal) !== JSON.stringify(afterVal)) {
      changed.push({ key, type: 'upsert', val: afterVal });
    }
  }
  for (const key of Object.keys(beforeMap)) {
    if (afterMap[key] === undefined) {
      changed.push({ key, type: 'delete' });
    }
  }
  return changed;
};

// -------------------------------------------------------------
// HELPERS: Format data chunks into readable text for RAG context
// -------------------------------------------------------------
const formatWorkoutChunk = (date, workoutDay, namesMap = {}) => {
  const lines = [];
  Object.entries(workoutDay).forEach(([exKey, val]) => {
    if (exKey === 'meta' || exKey === 'customName') return;
    const name = namesMap[exKey] || exKey;
    lines.push(`- ${name}: ${val.s || 0} sets x ${val.r || 0} reps @ ${val.w || 0}kg (${val.done === true ? 'Completed' : (val.done === false ? 'Skipped' : 'Logged')})`);
  });
  if (lines.length === 0) return null;
  return `Date: ${date}\nCategory: Workouts & Gym\nWorkout Split: ${workoutDay.meta?.label || 'Not specified'}\nExercises:\n${lines.join('\n')}`;
};

const formatFoodChunk = (date, foodDay) => {
  const lines = [];
  if (foodDay.water) lines.push(`- Water: ${foodDay.water} glasses`);
  if (foodDay.sleep) lines.push(`- Sleep: ${foodDay.sleep} hours`);
  if (foodDay.junk) lines.push(`- Junk food: ${foodDay.junk} items`);
  if (foodDay.items) {
    Object.entries(foodDay.items).forEach(([itemId, val]) => {
      if (val && val > 0) {
        const portionRatio = val === true || val === 3 ? 'Full' : (val === 2 ? '2/3' : '1/3');
        const name = (foodDay.custom && foodDay.custom[itemId]) || itemId;
        lines.push(`- Meal: ${name} (${portionRatio} portion)`);
      }
    });
  }
  if (lines.length === 0) return null;
  return `Date: ${date}\nCategory: Diet, Habits & Sleep\nLogged Items:\n${lines.join('\n')}`;
};

const formatStudyChunk = (date, studyDay) => {
  const lines = [];
  if (studyDay.sessions && Array.isArray(studyDay.sessions)) {
    studyDay.sessions.forEach(sess => {
      lines.push(`- Subject: ${sess.subjectId} (${sess.subjectLabel || sess.subjectId}), Hours: ${sess.hours || 0} hrs, Notes: ${sess.notes || 'None'}`);
    });
  }
  if (lines.length === 0) return null;
  return `Date: ${date}\nCategory: Study & Learning Progress\nLogged Sessions:\n${lines.join('\n')}`;
};

const formatBudgetChunk = (monthKey, budgetMonth) => {
  const lines = [];
  if (budgetMonth.entries && Array.isArray(budgetMonth.entries)) {
    budgetMonth.entries.forEach(entry => {
      lines.push(`- Title: ${entry.title || 'Untitled'}, Category: ${entry.category || 'N/A'}, Amount: ₹${entry.amount || 0}, Type: ${entry.type || 'expense'}, Date: ${entry.date || monthKey}`);
    });
  }
  if (lines.length === 0) return null;
  return `Month: ${monthKey}\nCategory: Budget & Expenses\nTransactions:\n${lines.join('\n')}`;
};

// -------------------------------------------------------------
// HELPER: Call Gemini API for embedding generation
// -------------------------------------------------------------
export const generateEmbedding = async (text, apiKey) => {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'models/gemini-embedding-001',
        content: { parts: [{ text }] }
      })
    }
  );
  if (!res.ok) {
    throw new Error(`Gemini embed failed: ${await res.text()}`);
  }
  const data = await res.json();
  return data.embedding?.values;
};

// -------------------------------------------------------------
// HELPERS: Direct REST calls to Pinecone DB using Namespaces
// -------------------------------------------------------------
const upsertToPinecone = async (host, apiKey, vectorId, vector, metadata, namespace) => {
  const res = await fetch(`https://corsproxy.io/?${host}/vectors/upsert`, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      vectors: [{
        id: vectorId,
        values: vector,
        metadata
      }],
      namespace // Isolates user data
    })
  });
  if (!res.ok) {
    throw new Error(`Pinecone upsert failed: ${await res.text()}`);
  }
};

const deleteFromPinecone = async (host, apiKey, vectorId, namespace) => {
  const res = await fetch(`https://corsproxy.io/?${host}/vectors/delete`, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ids: [vectorId],
      namespace // Must specify same namespace for deletion
    })
  });
  if (!res.ok) {
    throw new Error(`Pinecone delete failed: ${await res.text()}`);
  }
};

// -------------------------------------------------------------
// MAIN EXPORT: Find differences and sync logs to Pinecone
// -------------------------------------------------------------
export const syncFrontendRAG = async (category, beforeMap, afterMap, config, extraData = {}) => {
  const { pineconeApiKey, pineconeHost, geminiApiKey, userId } = config;
  
  if (!pineconeApiKey || !pineconeHost || !geminiApiKey || !userId) {
    // If user hasn't configured credentials, silently skip
    return;
  }

  const changes = getChangedKeys(beforeMap, afterMap);
  if (changes.length === 0) return;

  console.log(`[RAG Sync] Syncing category "${category}" to namespace "${userId}". Updates: ${changes.length}`);

  for (const change of changes) {
    const vectorId = `${userId}_${category}_${change.key}`;

    if (change.type === 'delete') {
      try {
        await deleteFromPinecone(pineconeHost, pineconeApiKey, vectorId, userId);
        console.log(`[RAG Sync] Deleted vector from namespace "${userId}": ${vectorId}`);
      } catch (err) {
        console.error(`[RAG Sync] Error deleting vector ${vectorId}:`, err);
      }
    } else {
      let content = null;
      if (category === 'workout') {
        content = formatWorkoutChunk(change.key, change.val, extraData.namesMap);
      } else if (category === 'food') {
        content = formatFoodChunk(change.key, change.val);
      } else if (category === 'study') {
        content = formatStudyChunk(change.key, change.val);
      } else if (category === 'budget') {
        content = formatBudgetChunk(change.key, change.val);
      }

      if (!content) {
        try {
          await deleteFromPinecone(pineconeHost, pineconeApiKey, vectorId, userId);
        } catch (_) {}
        continue;
      }

      try {
        const vector = await generateEmbedding(content, geminiApiKey);
        await upsertToPinecone(pineconeHost, pineconeApiKey, vectorId, vector, {
          userId,
          category,
          date: change.key,
          content
        }, userId);
        console.log(`[RAG Sync] Upserted vector to namespace "${userId}": ${vectorId}`);
      } catch (err) {
        console.error(`[RAG Sync] Error upserting vector ${vectorId}:`, err);
      }
    }
  }
};

// -------------------------------------------------------------
// MAIN EXPORT: Sync all existing logs to Pinecone in a bulk batch
// -------------------------------------------------------------
export const bulkSyncToPinecone = async (workouts, food, study, budget, config, extraData = {}, onProgress) => {
  const { pineconeApiKey, pineconeHost, geminiApiKey, userId } = config;
  if (!pineconeApiKey || !pineconeHost || !geminiApiKey || !userId) {
    throw new Error("Missing required Pinecone or Gemini credentials.");
  }

  const tasks = [];

  // Gather Workouts
  if (workouts) {
    Object.entries(workouts).forEach(([date, val]) => {
      const content = formatWorkoutChunk(date, val, extraData.namesMap);
      if (content) {
        tasks.push({
          vectorId: `${userId}_workout_${date}`,
          category: 'workout',
          date,
          content
        });
      }
    });
  }

  // Gather Food
  if (food) {
    Object.entries(food).forEach(([date, val]) => {
      const content = formatFoodChunk(date, val);
      if (content) {
        tasks.push({
          vectorId: `${userId}_food_${date}`,
          category: 'food',
          date,
          content
        });
      }
    });
  }

  // Gather Study
  if (study) {
    Object.entries(study).forEach(([date, val]) => {
      const content = formatStudyChunk(date, val);
      if (content) {
        tasks.push({
          vectorId: `${userId}_study_${date}`,
          category: 'study',
          date,
          content
        });
      }
    });
  }

  // Gather Budget
  if (budget) {
    Object.entries(budget).forEach(([monthKey, val]) => {
      const content = formatBudgetChunk(monthKey, val);
      if (content) {
        tasks.push({
          vectorId: `${userId}_budget_${monthKey}`,
          category: 'budget',
          date: monthKey,
          content
        });
      }
    });
  }

  const total = tasks.length;
  if (total === 0) {
    if (onProgress) onProgress(0, 0, "No records found to sync.");
    return;
  }

  console.log(`[Bulk Sync] Found ${total} items to index into Pinecone namespace "${userId}"`);

  for (let i = 0; i < total; i++) {
    const task = tasks[i];
    if (onProgress) onProgress(i + 1, total, `Syncing ${task.category} for ${task.date}...`);

    try {
      const vector = await generateEmbedding(task.content, geminiApiKey);
      await upsertToPinecone(pineconeHost, pineconeApiKey, task.vectorId, vector, {
        userId,
        category: task.category,
        date: task.date,
        content: task.content
      }, userId);
    } catch (err) {
      console.error(`[Bulk Sync] Failed item ${i+1}/${total}:`, err);
    }
  }

  if (onProgress) onProgress(total, total, "Sync complete!");
};
