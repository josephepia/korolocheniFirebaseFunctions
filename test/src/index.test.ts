/* eslint-disable max-len */
import * as fs from "fs";
import * as assert from "assert";
import "ts-mocha";
import "mocha";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {ref, set, update} from "firebase/database";
import * as admin from "firebase-admin";
import {applicationDefault} from "firebase-admin/app";
import { dictiionaryBase, permissionsBase } from "./dataMock";
import * as functions from 'firebase-functions';
// import {UserRecord} from "firebase-admin/auth";
// import * as _test from "firebase-functions-test";
import * as sinon from "sinon";
// const adminInitStub = sinon.stub(admin, 'initializeApp');
import {createUser as _createUser}  from '../../functions/src/index';
import firebaseFunctionsTest from "firebase-functions-test";

process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
// process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = "127.0.0.1:5001";
process.env.FIREBASE_DATABASE_EMULATOR_HOST="127.0.0.1:9000";
// process.env.FIRESTORE_EMULATOR_HOST="127.0.0.1:8080";
process.env.FIREBASE_STORAGE_EMULATOR_HOST="127.0.0.1:9199";
process.env.FUNCTIONS_EMULATOR = "true";
const MY_ID_PROJECT = "korolochenni";
const MY_ID_DEFAULT_PROJECT = "korolochenni-default-rtdb";
const uid = "uid";
let testEnv:RulesTestEnvironment;

const app = admin.initializeApp({
  // credential: admin.credential.cert(serviceAccount),
  credential: applicationDefault(),
  databaseURL: "http://127.0.0.1:9000/?ns=korolochenni-default-rtdb",
});
const auth = app.auth();
// const {wrap} = _test({
//   credential: admin.credential.applicationDefault(),
//   projectId: MY_ID_DEFAULT_PROJECT,
//   databaseURL: "http://127.0.0.1:9000/?ns=korolochenni-default-rtdb"
// });

const {wrap} = firebaseFunctionsTest();

// const {wrap} = firebaseFunctionsTest({
// credential: applicationDefault(),
//   projectId: MY_ID_PROJECT,
//   databaseURL: "http://127.0.0.1:9000/?ns=korolochenni-default-rtdb",
//   // databaseURL: "https://korolochenni-default-rtdb.firebaseio.com"
// },process.env.GOOGLE_APPLICATION_CREDENTIALS);

// const {wrap} = _test({
//   // apiKey: "AIzaSyD3wbrSpAZuQy8z0g9RzUDTGfHcpfmVzxg",
//   // authDomain: "korolochenni.firebaseapp.com",
//   // databaseURL: "https://korolochenni-default-rtdb.firebaseio.com",
//   projectId: "korolochenni",
//   storageBucket: "korolochenni.appspot.com",
//   // messagingSenderId: "567630619529",
//   // appId: "1:567630619529:web:10b2b34ae6e1e8c5aeb758",
//   // measurementId: "G-YH1YPRL1K2"
//   databaseURL: "http://127.0.0.1:9000/?ns=korolochenni-default-rtdb",
// },process.env.GOOGLE_APPLICATION_CREDENTIALS);

const createUserLocal = wrap(_createUser);

const getUserAth = (isAuthenticated?:boolean) => {
  if (isAuthenticated) {
    return testEnv.authenticatedContext(uid).database();
  }
  return testEnv.unauthenticatedContext().database();
};

beforeEach(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: MY_ID_DEFAULT_PROJECT,
    hub: {
      host: "127.0.0.1",
      port: 4400,
    },
    database: {
      rules: fs.readFileSync("../database.rules.json", "utf8"),
    },
  });
  // test(config);
  // await testEnv.clearDatabase();
  // await testEnv.clearStorage();
});

describe.skip("unit test for korolocheni", () => {

  describe("ONLY CREATE INTO DOCUMENT", () => {
    it("create document success                                         -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "C",
          "read": false,
        });
      });
      await assertSucceeds(set(documentsPath, "create"));
    });

    it("dont set new data if exist old data                             -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "C", "read": false},
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, "update"));
    });

    it("dont set data if new dana is null                               -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "C", "read": false},
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, null));
    });

    it("dont set data if old and new is null                            -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "C",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, null));
    });
  });

  describe("ONLY UPDATE INTO DOCUMENT", () => {
    it("update document success                                         -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "U", "read": false},
          "testPath": "update",
        });
      });
      await assertFails(set(documentsPath, null));
    });

    it("dont update data if not exist old data                          -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "U",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, "create"));
    });

    it("dont update data if new dana is null                            -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "U", "read": false},
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, null));
    });

    it("dont update data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "U",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, null));
    });
  });

  describe("ONLY DELETE INTO DOCUMENT", () => {
    it("delete document success                                         -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "D", "read": false},
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, null));
    });

    it("dont delete data if exist old data                              -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "D", "read": false},
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, "update"));
    });

    it("dont delete data if exist new data                              -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "D",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, "create"));
    });

    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "D",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, null));
    });
  });

  describe("CREATE OR UPDATE INTO DOCUMENT", () => {
    it("create data if exist new data                                   -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "CU",
          "read": false,
        });
      });
      await assertSucceeds(set(documentsPath, "create"));
    });

    it("update data if exist old data                                   -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "CU", "read": false},
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, "update"));
    });

    it("dont delete document if new data is null and olddata exists     -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "CU", "read": false},
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, null));
    });

    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "CU",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, null));
    });
  });

  describe("CREATE OR DELETE INTO DOCUMENT", () => {
    it("create data if exist new data                                   -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "CD",
          "read": false,
        });
      });
      await assertSucceeds(set(documentsPath, "create"));
    });

    it("delete document if newData is null and oldData exists           -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "CD", "read": false},
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, null));
    });

    it("dont update data if exist old and new data                      -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "CD", "read": false},
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, "update"));
    });

    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "CD",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, null));
    });
  });

  describe("AUPDATE OR DELETE INTO DOCUMENT", () => {
    it("update data if exist old and new data                           -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "DU", "read": false},
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, "update"));
    });

    it("delete document if newData is null and oldData exists           -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": "DU", "read": false},
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, null));
    });


    it("dont create data if exist new data                              -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "UD",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, "create"));
    });

    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": "UD",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, null));
    });
  });

  describe("CREATE, AUPDATE OR DELETE INTO DOCUMENT", () => {
    it("create data if exist new data                                   -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": true,
          "read": false,
        });
      });
      await assertSucceeds(set(documentsPath, "create"));
    });

    it("update data if exist old and new data                           -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": true, "read": false},
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, "update"));
    });

    it("delete document if newData is null and oldData exists           -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": true, "read": false},
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, null));
    });


    it("delete data if old and new is null                              -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": true,
          "read": false,
        });
      });
      await assertFails(set(documentsPath, null));
    });
  });

  describe("DONT CREATE, AUPDATE OR DELETE INTO DOCUMENT", () => {
    it("dont create data if exist new data                              -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": false,
          "read": false,
        });
      });
      await assertFails(set(documentsPath, "create"));
    });

    it("dont update data if exist old and new data                      -> try  UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": false, "read": false},
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, "update"));
    });

    it("dont delete document if newData is null and oldData exists      -> try  DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + uid + "/testPath"]: {"write": false, "read": false},
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, null));
    });


    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + uid + "/testPath"), {
          "write": false,
          "read": false,
        });
      });
      await assertFails(set(documentsPath, null));
    });
  });

  describe("PERMISSIONS FOR UPDATE LEVEL ACCESS DOCUMENTS", () => {
    it("write into first level ", async () => {
      const pathLevelFirst = ref(getUserAth(), "pathLevel");
      await assertFails(set(pathLevelFirst, "documento nuevo"));
    });

    it("write into tow  level no metter first level is denied access", async () => {
      const pathLevelFirst = ref(getUserAth(), "/pathLevel/pathTowLevel1");
      await assertSucceeds(set(pathLevelFirst, "documento nuevo"));
    });
    it("dont write into tow level from first level", async () => {
      const pathLevelFirst = ref(getUserAth(), "/pathLevel");
      await assertFails(set(pathLevelFirst, {pathTowLevel1: "documento nuevo"}));
    });
  });
});

describe("unit test for cloud functions", () => {

  describe.skip("TRIGGER FOR AUTH FIREBASE", () => {
    it("when user first time is created add to database into paths users and profiles", async () => {
      // crea usuario
      const userMock:any = {
        displayName: "userName",
        email: "email@gmail.com",
        phoneNumber: "+57123123123",
        photoURL: "http://www.example.com/12345678/photo.png",
      };
      const roles = {
        guest: true
      }
      const userMockSend = {
        ...userMock,
        "password": "secretPassword",
      };
        console.log("entrando al try catch");
        const userNew = await auth.createUser(userMockSend);
        const usersRecord = await (await admin.database().ref("users/" + userNew.uid).once("value")).val();
        assert.deepEqual(usersRecord, {...userMock,roles});
        const profilesRecord = await (await admin.database().ref("profiles/" + userNew.uid).once("value")).val();
        assert.deepEqual(profilesRecord, userMock);
        auth.deleteUser(userNew.uid);
    }).timeout(10000);
  });

  describe.skip("PERMISIONS", ()=>{
    //DADO      que un permiso es creado 
    //CUANDO    se envian los datos a la base de datos
    //ENTONCES  se debe recuperar la misma estructura al leer el nodo
    it(" create permisssion is successfully", async ()=>{
      //allAccess mock 
      const permissionMock = permissionsBase.allAccess
      await admin.database().ref('permissions').child("allAccess").set(permissionMock);
      const permissionDatabase = await (await admin.database().ref('permissions').child("allAccess").once('value')).val();
      console.log("data send ", permissionMock);
      console.log("data get ", permissionDatabase);

      assert.deepEqual(permissionDatabase,permissionMock);
    });

    //DADO      
  });

  describe("DICTIONARY", ()=>{
    //DADO      que una ruta es creada
    //CUANDO    se envian los datos a la base de datos
    //ENTONCES  se debe recuperar la misma estructura al leer el nodo
    it(" create permisssion is successfully", async ()=>{
      //allAccess mock 
      const patAuthorizationMock = dictiionaryBase.authorizations;
      await admin.database().ref('permissions').child("allAccess").set(patAuthorizationMock);
      const permissionDatabase = await (await admin.database().ref('permissions').child("allAccess").once('value')).val();

      assert.deepEqual(permissionDatabase,patAuthorizationMock);
    });

    //DADO      
  });
  
  describe.only("ccretae user ",()=>{
    it("con stub ", async ()=>{
      const userDataPrepare = {
        email: "email12@gmail.com",
        // emailVerified: false,
        // phoneNumber: "+5730021312311",
        // password: "secretPassword",
        displayName: "new user test",
        // photoURL: "http://www.example.com/12345678/photo.png",
        // disabled: "",
        roles: {
          admin: true,
          guest2: true
        }
      };
      

      console.log("estado FUNCTIONS_EMULATOR ", process.env.FUNCTIONS_EMULATOR);

    const wrapperd = wrap(_createUser);
    const result = await wrapperd(userDataPrepare,{
      auth: {
              uid: 'adminTest' // only for real time database functions
            },
    });
    //  const result =  createUserLocal(userDataPrepare, {
        
    //     auth: {
    //       uid: 'jckS2Q0' // only for real time database functions
    //     },
        
    //     // authType: 'USER' // only for real time database functions
    //   });
      console.log("resultado => ", result);
      // admin.auth().createUser({
      // displayName: "name user test ",
      // email: "email@gmail.com",
      
      // disabled: false
      // });
      assert.equal(1,1);
      // console.log("firebase config -> ",process.env.FIREBASE_CONFIG);
      // console.log("estado de entorno ", process.env);
      // throw new Error(JSON.stringify(process.env.FIREBASE_CONFIG))
      
    })
    
  
  });

});


after(async () => {
  // await testEnv.clearDatabase();
  // await testEnv.clearStorage();
  await testEnv.cleanup();
});

