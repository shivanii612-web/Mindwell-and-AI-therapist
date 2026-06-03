# MindWell Backup Strategy

This document outlines the backup and recovery strategy for the MindWell platform's MongoDB Atlas database.

## 1. Automated Snapshots (MongoDB Atlas)
Since MindWell uses MongoDB Atlas, we leverage its built-in cloud backup features:
- **Cloud Backups**: Enable automated continuous cloud backups in the Atlas UI.
- **Snapshot Frequency**: 
  - Hourly snapshots (retained for 2 days).
  - Daily snapshots (retained for 30 days).
  - Weekly snapshots (retained for 1 year).
- **Point-in-Time Recovery (PITR)**: Provides the ability to restore the cluster to any point in time within the last 24 hours.

## 2. On-Demand Backups
Before performing major database migrations or schema refactors:
1. Navigate to the **Atlas Console**.
2. Go to **Database Deployments**.
3. Select your cluster and click **Backup**.
4. Click **Take Snapshot Now**.

## 3. Disaster Recovery (DR) Process
In the event of data loss or corruption:
1. Identify the latest healthy snapshot.
2. Select **Restore** in the Atlas Backup interface.
3. Choose **Point-in-Time Restore** for maximum precision or a specific snapshot.
4. Restore to a new temporary cluster to verify data integrity before overwriting production.

## 4. Local Backup (Emergency Only)
For a hard local copy of critical data, developers can run:
```bash
mongodump --uri="mongodb+srv://<username>:<password>@cluster.mongodb.net/mindwell" --out="./backups/$(date +%Y-%m-%d)"
```
> [!CAUTION]
> Ensure local backups are stored securely and encrypted, as they contain sensitive user data.
