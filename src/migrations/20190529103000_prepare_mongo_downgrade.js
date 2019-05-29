/*
Copyright: Ambrosus Inc.
Email: tech@ambrosus.com

This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.

This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0.
*/

// eslint-disable-next-line import/prefer-default-export
export const up = async (db, config, logger) => {
  const currentFeatureVersion = (await db.admin().command({getParameter: 1, featureCompatibilityVersion: 1})).featureCompatibilityVersion.version;
  if (currentFeatureVersion === '4.0') {
    return;
  }
  await db.admin().command({setFeatureCompatibilityVersion: '4.0'});

  const indexesToRecreate = [];

  const allCollections = (await db.collections());
  for (const collection of allCollections) {
    const indexes = await (collection.indexes());
    for (const index of indexes) {
      if (index.unique) {
        indexesToRecreate.push({collectionName: collection.collectionName, index});
      }
    }
  }
  for (const indexInCollection of indexesToRecreate) {
    logger.info(`Dropping and recreating the following index:${JSON.stringify(indexInCollection.index)}`);
    try {
      await db.collection(indexInCollection.collectionName).dropIndex(indexInCollection.index.name);
      await db.collection(indexInCollection.collectionName).createIndexes([indexInCollection.index]);
    } catch (error) {
      logger.error(error);
    }
  }
};
