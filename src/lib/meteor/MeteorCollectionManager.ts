import MeteorMysqlCollection from "./MeteorMysqlCollection";

import * as Promise from "bluebird";

/**
 * Info we need to collect:
 * #1 Collections
 * #2 This and foreign key
 * #3* Criteria where clause from fill methods
 */
interface MeteorMysqlCollectionInfo {
	collection: MeteorMysqlCollection<any>;
	thisKey: string;
	foreignKey: string;

}

/**
 * Static/Singleton class
 */
class MeteorCollectionManager {
	private static _instance: MeteorCollectionManager = undefined;
	static getInstance() {
		if (MeteorCollectionManager._instance === undefined) {
			MeteorCollectionManager._instance = new MeteorCollectionManager();
		}
		return MeteorCollectionManager._instance;
	}


	private infos: MeteorMysqlCollectionInfo[] = [];
	
	
	/**
	 * Add/remove/update to parentCol the newest item added/removed/updated to childCol.
	 */
	/*linkCollections<T1, T2>(parentCol: MeteorMysqlCollection<T1>, childCol: MeteorMysqlCollection<T2>, criteriaJsRawObject: any) {

		var criteria = parentCol.table.criteriaDivider.divide(criteriaJsRawObject);
		if (criteria.tables.map(t=> t.tableName).indexOf(childCol.table.name) >= 0) { //ontws sindeonte auta ta 2 me to criteria pou dw9ike sto parent.
			childCol.on('INSERT', (childObj) => {
				parentCol._collection.find().fetch().forEach(objInCol=>{
			 ///TODO: ....
				});
			});

			childCol.on('REMOVE', (removedCriteriaContainsId) => {

			});
		}

	}*/

}

export default MeteorCollectionManager;