import fs from 'fs';
import assert from 'assert';
import {
    assertFails,
    assertSucceeds,
    initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { ref, set, get, update,getDatabase } from "firebase/database";
import * as admin from "firebase-admin";

const MY_ID_PROJECT = "korolochenni";
const uid = "uid";
let testEnv;

const getUserAth = (isAuthenticated) => {
    if (isAuthenticated) {
        return testEnv.authenticatedContext(uid).database();
    }
    return testEnv.unauthenticatedContext();
};

beforeEach(async () => {

    testEnv = await initializeTestEnvironment({
        projectId: MY_ID_PROJECT,
        hub: {
            host: "127.0.0.1",
            port: "4400"
        },
        database: {
            rules: fs.readFileSync("../database.rules.json", "utf8"),
        }
    });
    await testEnv.clearDatabase();
    await testEnv.clearStorage();

});

describe("unit test for korolocheni", () => {
    

    describe("ONLY CREATE INTO DOCUMENT", () => {

        it("create document success                                         -> try CREATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "C",
                    "read": false
                });
            });
            await assertSucceeds(set(documentsPath, 'create'));
        });

        it("dont set new data if exist old data                             -> try UPDATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "C", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertFails(set(documentsPath, 'update'));
        });

        it("dont set data if new dana is null                               -> try DELETE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "C", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertFails(set(documentsPath, null));
        });

        it("dont set data if old and new is null                            -> try STRANGE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "C",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, null));
        });

    });

    describe("ONLY UPDATE INTO DOCUMENT", () => {

        it("update document success                                         -> try UPDATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "U", "read": false},
                    "testPath": "update"
                });
            });
            await assertFails(set(documentsPath, null));
        });

        it("dont update data if not exist old data                          -> try CREATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "U",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, 'create'));
        });

        it("dont update data if new dana is null                            -> try DELETE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "U", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertFails(set(documentsPath, null));
        });

        it("dont update data if old and new is null                         -> try STRANGE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "U",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, null));
        });

    });

    describe("ONLY DELETE INTO DOCUMENT", () => {

        it("delete document success                                         -> try DELETE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "D", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertSucceeds(set(documentsPath, null));
        });

        it("dont delete data if exist old data                              -> try UPDATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "D", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertFails(set(documentsPath, 'update'));
        });

        it("dont delete data if exist new data                              -> try CREATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "D",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, 'create'));
        });

        it("dont delete data if old and new is null                         -> try STRANGE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "D",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, null));
        });

    });

    describe("CREATE OR UPDATE INTO DOCUMENT", () => {

        it("create data if exist new data                                   -> try CREATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "CU",
                    "read": false
                });
            });
            await assertSucceeds(set(documentsPath, 'create'));
        });

        it("update data if exist old data                                   -> try UPDATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "CU", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertSucceeds(set(documentsPath, 'update'));
        });

        it("dont delete document if new data is null and olddata exists     -> try DELETE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "CU", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertFails(set(documentsPath, null));
        });

        it("dont delete data if old and new is null                         -> try STRANGE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "CU",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, null));
        });

    });

    describe("CREATE OR DELETE INTO DOCUMENT", () => {

        it("create data if exist new data                                   -> try CREATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "CD",
                    "read": false
                });
            });
            await assertSucceeds(set(documentsPath, 'create'));
        });

        it("delete document if newData is null and oldData exists           -> try DELETE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "CD", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertSucceeds(set(documentsPath, null));
        });

        it("dont update data if exist old and new data                      -> try UPDATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "CD", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertFails(set(documentsPath, 'update'));
        });

        it("dont delete data if old and new is null                         -> try STRANGE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "CD",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, null));
        });

    });

    describe("AUPDATE OR DELETE INTO DOCUMENT", () => {

        it("update data if exist old and new data                           -> try UPDATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "UD", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertSucceeds(set(documentsPath, 'update'));
        });

        it("delete document if newData is null and oldData exists           -> try DELETE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": "UD", "read": false},
                    "testPath": "oldData"
                });
            });
            await assertSucceeds(set(documentsPath, null));
        });


        it("dont create data if exist new data                              -> try CREATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "UD",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, 'create'));
        });

        it("dont delete data if old and new is null                         -> try STRANGE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": "UD",
                    "read": false
                });
            });
            await assertFails(set(documentsPath, null));
        });

    });

    describe("CREATE, AUPDATE OR DELETE INTO DOCUMENT", () => {

        it("create data if exist new data                                   -> try CREATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": true,
                    "read": false
                });
            });
            await assertSucceeds(set(documentsPath, 'create'));
        });

        it("update data if exist old and new data                           -> try UPDATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": true, "read": false},
                    "testPath": "oldData"
                });
            });
            await assertSucceeds(set(documentsPath, 'update'));
        });

        it("delete document if newData is null and oldData exists           -> try DELETE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": true, "read": false},
                    "testPath": "oldData"
                });
            });
            await assertSucceeds(set(documentsPath, null));
        });


        

        it("delete data if old and new is null                              -> try STRANGE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": true,
                    "read": false
                });
            });
            await assertFails(set(documentsPath, null));
        });

    });

    describe("DONT CREATE, AUPDATE OR DELETE INTO DOCUMENT", () => {

        it("dont create data if exist new data                              -> try CREATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": false,
                    "read": false
                });
            });
            await assertFails(set(documentsPath, 'create'));
        });

        it("dont update data if exist old and new data                      -> try  UPDATE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": false, "read": false},
                    "testPath": "oldData"
                });
            });
            await assertFails(set(documentsPath, 'update'));
        });

        it("dont delete document if newData is null and oldData exists      -> try  DELETE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled(async context => {            
                return update(ref(context.database()),{
                    ['authorizations/'+uid+'/testPath']: {"write": false, "read": false},
                    "testPath": "oldData"
                });
            });
            await assertFails(set(documentsPath, null));
        });


        

        it("dont delete data if old and new is null                         -> try STRANGE", async () => {
            const documentsPath = ref(getUserAth(true), 'testPath');
            await testEnv.withSecurityRulesDisabled( context => {
                return set(ref(context.database(),'authorizations/' + uid + "/testPath"),{
                    "write": false,
                    "read": false
                });
            });
            await assertFails(set(documentsPath, null));
        });

    });

});

after(async () => {
    await testEnv.clearDatabase();
    await testEnv.clearStorage();
    await testEnv.cleanup();
});

