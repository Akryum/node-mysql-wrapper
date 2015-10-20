import Helper from "../Helper";
import Table from "../Table";
import ConditionalConverter from "../ConditionalConverter";

declare module Meteor {
    var isServer: boolean;
    var isClient: boolean;

    var bindEnvironment: Function;
}

class MeteorHelper {

    static canInsert(objRow: any, rawCriteria, joinedRow?: any): boolean {
        let canInsert = true;
        //prin to eisagw stin lista prepei na elenksw an anoikei stin lista, vasi tou criteria pou egine fill h collection.
        Helper.forEachKey(rawCriteria, key=> {
            if (!canInsert) {
                return;
            }
            try {
                if (objRow[key] !== undefined) {
                    ///edw elenxw to IN (value1,value2,value3).
                    let _valCriteria = rawCriteria[key];
                    let _valSplited = _valCriteria.split(" ");
                    if (_valSplited[0] === "IN(") {
                        //convert IN to multi || statements.
						
                        let _values = _valCriteria.substring(_valSplited[0].length, _valCriteria.lastIndexOf(")")).split(","); //except the last ) and whitespaces (?) 
					
                        _values = " " + objRow[key] + " === " + _values.join("|| " + objRow[key] + " === ");
                        if (!eval(_values)) {
                            canInsert = false;
                        }
                    } else {

                        let _symbolCombarison = ConditionalConverter.toJS(_valSplited[0]);
                        let valComparison = _valSplited[1];
                        let ifEvalStatementStr = objRow[key] + _symbolCombarison + valComparison;//Eg. key: yearsOld,rawCriteria[key]: ' >=16'
                        ifEvalStatementStr = ConditionalConverter.toJSConditional(ifEvalStatementStr);
                        if (!eval(ifEvalStatementStr)) {
                            canInsert = false;
                        }


                    }
                }
            } catch (ex) {
                canInsert = false; //maybe will remove it if bug occurs.
            }
        });

        return canInsert;
    }


    /**
     * ///TODO: FUTURE-> event: "INSERT" || "UPDATE" || "DELETE"
     * table: The Table object
     * collectionArray: The collection which is checking if can...
     * action:action when can...
     */
    static listenToTableInsert(table: Table<any>, collectionArray: Array<any>, criteriaRawJsObject: any, action: (parentPropertyName: string, objRow: any, selector: any, isArray: boolean) => void): void {
        let criteria = table.criteriaDivider.divide(criteriaRawJsObject);

        criteria.tables.forEach(_tb=> {
            let joinedTableObj = table.connection.table(_tb.tableName);
            //edw pernw ta criteria gia to joined table.
            let joinedTableCriteria = joinedTableObj.criteriaDivider.divide(criteria.rawCriteriaObject[_tb.propertyName]);

            joinedTableObj.on("INSERT", Meteor.bindEnvironment((rows: any[]) => {
                rows.forEach(row=> {
                    let objRow = joinedTableObj.objectFromRow(row);
                    //let rawCriteria = joinedTableCriteria.rawCriteriaObject;

                    // let canInsert = this.objectCanInsert(objRow, joinedTableCriteria.rawCriteriaObject);
                    //edw vgazei sfalma logika gt to eval einai: 18= userId (an dn uparxei .at(joined).where), ara:
                    //  this._collection.find().fetch().forEach(_objInlist=> {
                    collectionArray.forEach(_objInlist=> {
                        let joinedCriteria = {};
                        Helper.forEachKey(joinedTableCriteria.rawCriteriaObject, key=> {
                            try {
                                let valWithoutComparison = joinedTableCriteria.rawCriteriaObject[key].split(" ")[1]; //0 = comparison:= ,1: userId
                                let valComparisonSymbol = joinedTableCriteria.rawCriteriaObject[key].split(" ")[0];

                                if (_objInlist[valWithoutComparison] !== undefined) {
                                    joinedCriteria[key] = valComparisonSymbol + " " + _objInlist[valWithoutComparison];
                                }
                            } catch (ex) {
                                //edw ginete catch an to key einai object kai den exei to split method, dld einai eite to table rules eite alla joined tables mesa se auto to joined tables, auto sto mellon 9a to diaxiristw.
                            }
                        });
                        let canInsert = MeteorHelper.canInsert(objRow, joinedCriteria);
                        if (canInsert) {
                            let parentPropName = _tb.propertyName;

                            let primkey = Helper.toObjectProperty(table.primaryKey);
                            let objToFind = {};
                            objToFind[primkey] = _objInlist[primkey];
                            if (_objInlist[parentPropName] instanceof Array) {
                                _objInlist[parentPropName].push(objRow);
                                /*
                                let toPushArrayObj = {};
                                toPushArrayObj["$push"] = {};
                                toPushArrayObj["$push"][parentPropName] = objRow;
                                let updateResult = this.collection.update(objToFind, toPushArrayObj, { multi: true, upsert: false }, (err, res) => {
                                    if (this.debug) {
                                        if (err) {
                                            console.log('ERROR ON UPDATE: ' + err);
                                        }

                                        console.log("------------------------RESULT(1=success,0=faled): " + res + " PUSHED TO ARRAY, NEW ARRAY LENGTH: " + _objInlist[parentPropName]["length"]); //this.collection.find(objToFind).fetch()[0][_tb.propertyName]["length"]);
                                    }
                                });*/
                                action(parentPropName, objRow, objToFind, true);


                            } else {
                                /* let toSetObj = {};
                                 toSetObj["$set"] = {};
                                 toSetObj["$set"][parentPropName] = objRow;
                                 this.collection.update(objToFind, toSetObj);*/
                                action(parentPropName, objRow, objToFind, false);
                            }


                            ///TODO:
                            //edw psaxnw se pio object mesa sto collection anoikei to inserted row.
                            //this._collection.find().fetch({});
                            //elenxw an einai array tote kantw push, an einai object apla valtw ( borei na min einai panta array px users me user_profiles)
                            //if(val instanceof Array){}else{}
                        }
                    });


                });


            }));
        });
    }
}

export default MeteorHelper;