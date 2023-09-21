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
import { ref, set, update, get, onValue } from "firebase/database";
import * as admin from "firebase-admin";
import { applicationDefault } from "firebase-admin/app";
import { dictionaryBase, permissionsBase } from "./dataMock";
import * as databseMock from "./korolochenni-default-rtdb.json";
import * as functions from 'firebase-functions';
// import {UserRecord} from "firebase-admin/auth";
// import * as _test from "firebase-functions-test";
import * as sinon from "sinon";
// const adminInitStub = sinon.stub(admin, 'initializeApp');
import { createUser as _createUser } from '../../functions/src/index';
import firebaseFunctionsTest from "firebase-functions-test";
// import {expect} from '@jest/globals';
import { expect, assert as assertChai } from 'chai';
import * as should from 'should';
process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
// process.env.FIREBASE_FUNCTIONS_EMULATOR_HOST = "127.0.0.1:5001";
process.env.FIREBASE_DATABASE_EMULATOR_HOST = "127.0.0.1:9000";
// process.env.FIRESTORE_EMULATOR_HOST="127.0.0.1:8080";
process.env.FIREBASE_STORAGE_EMULATOR_HOST = "127.0.0.1:9199";
process.env.FUNCTIONS_EMULATOR = "true";
const MY_ID_PROJECT = "korolochenni";
const MY_ID_DEFAULT_PROJECT = "korolochenni-default-rtdb";
const UID = "uid";
let testEnv: RulesTestEnvironment;

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

const { wrap } = firebaseFunctionsTest();

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

//obtener un usuario autenticado o desautenticado en una ruta especifica
// UID por defecto
const getUserAth = (isAuthenticated?: boolean, uid: any = UID) => {
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
  await testEnv.clearDatabase();
  await testEnv.clearStorage();

  //http://localhost:9099/emulator/v1/projects/{project-id}/accounts

  await testEnv.withSecurityRulesDisabled((context) => {
    return set(ref(context.database(), "/"), databseMock);
  });
});

describe("                               •••• unit test for CRUD paths access ••••", () => {

  describe("ONLY CREATE INTO DOCUMENT", () => {
    it("create document success                                         -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": "C", "read": false },
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, "update"));
    });

    it("dont set data if new dana is null                               -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + UID + "/testPath"]: { "write": "C", "read": false },
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, null));
    });

    it("dont set data if old and new is null                            -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": "U", "read": false },
          "testPath": "update",
        });
      });
      await assertFails(set(documentsPath, null));
    });

    it("dont update data if not exist old data                          -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": "U", "read": false },
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, null));
    });

    it("dont update data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": "D", "read": false },
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, null));
    });

    it("dont delete data if exist old data                              -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + UID + "/testPath"]: { "write": "D", "read": false },
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, "update"));
    });

    it("dont delete data if exist new data                              -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
          "write": "D",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, "create"));
    });

    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": "CU", "read": false },
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, "update"));
    });

    it("dont delete document if new data is null and olddata exists     -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + UID + "/testPath"]: { "write": "CU", "read": false },
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, null));
    });

    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": "CD", "read": false },
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, null));
    });

    it("dont update data if exist old and new data                      -> try UPDATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + UID + "/testPath"]: { "write": "CD", "read": false },
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, "update"));
    });

    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": "DU", "read": false },
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, "update"));
    });

    it("delete document if newData is null and oldData exists           -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + UID + "/testPath"]: { "write": "DU", "read": false },
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, null));
    });


    it("dont create data if exist new data                              -> try CREATE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
          "write": "UD",
          "read": false,
        });
      });
      await assertFails(set(documentsPath, "create"));
    });

    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": true, "read": false },
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, "update"));
    });

    it("delete document if newData is null and oldData exists           -> try DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + UID + "/testPath"]: { "write": true, "read": false },
          "testPath": "oldData",
        });
      });
      await assertSucceeds(set(documentsPath, null));
    });


    it("delete data if old and new is null                              -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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
          ["authorizations/" + UID + "/testPath"]: { "write": false, "read": false },
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, "update"));
    });

    it("dont delete document if newData is null and oldData exists      -> try  DELETE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        return update(ref(context.database()), {
          ["authorizations/" + UID + "/testPath"]: { "write": false, "read": false },
          "testPath": "oldData",
        });
      });
      await assertFails(set(documentsPath, null));
    });


    it("dont delete data if old and new is null                         -> try STRANGE", async () => {
      const documentsPath = ref(getUserAth(true), "testPath");
      await testEnv.withSecurityRulesDisabled((context) => {
        return set(ref(context.database(), "authorizations/" + UID + "/testPath"), {
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

    it("write into two  level no matter first level is denied access", async () => {
      const pathLevelFirst = ref(getUserAth(), "/pathLevel/pathTowLevel1");
      await assertSucceeds(set(pathLevelFirst, "documento nuevo"));
    });
    it("dont write into two level from first level", async () => {
      const pathLevelFirst = ref(getUserAth(), "/pathLevel");
      await assertFails(set(pathLevelFirst, { pathTowLevel1: "documento nuevo" }));
    });

    it("dont read all first level", async () => {
      const pathTwoLevel1 = ref(getUserAth(), "/pathLevel/pathTowLevel1");
      const pathTwoLevel2 = ref(getUserAth(), "/pathLevel/pathTowLevel2");
      const pathTwoLevel3 = ref(getUserAth(), "/pathLevel/pathTowLevel3");
      const pathLevelFirst = ref(getUserAth(), "/pathLevel");
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await set(pathTwoLevel1, "documento nuevo 1");
        await set(pathTwoLevel2, "documento nuevo 2");
        await set(pathTwoLevel3, "documento nuevo 3");
      });

      await assertSucceeds(get(pathLevelFirst));
    });
    it("dont read two first level", async () => {
      const pathTwoLevel1 = ref(getUserAth(), "/pathLevel/pathTowLevel1");
      const pathTwoLevel2 = ref(getUserAth(), "/pathLevel/pathTowLevel2");
      const pathTwoLevel3 = ref(getUserAth(), "/pathLevel/pathTowLevel3");

      await testEnv.withSecurityRulesDisabled(async (context) => {
        await set(pathTwoLevel1, "documento nuevo 1 e");
        await set(pathTwoLevel2, "documento nuevo 2 e");
        await set(pathTwoLevel3, "documento nuevo 3 e");
      });
      await assertSucceeds(get(pathTwoLevel1));
    });
  });
});

describe("                               •••• unit test for cloud functions ••••", () => {

  describe("PERMISIONS", () => {
    // DADO      que un permiso es creado 
    // CUANDO    se envian los datos a la base de datos
    // ENTONCES  se debe recuperar la misma estructura al leer el nodo
    it(" create permisssion is successfully like super admin", async () => {
      //allAccess mock 
      const permissionMock = permissionsBase.allAccess
      await admin.database().ref('permissions').child("allAccess").set(permissionMock);
      const permissionDatabase = await (await admin.database().ref('permissions').child("allAccess").once('value')).val();
      assert.deepEqual(permissionDatabase, permissionMock);
    });

    // DADO un usuario 
    // CUANDO intenta registrar un permiso con los privilegios necesarios
    // ENTONCES el registro ser[a] exitoso

    it("create permission with allowed privileges", async () => {
      // ccreate user with allowed privilegies
      const userMock = {

        email: "email@gmail.com",
        displayName: "user guest2",

      };
      const roles = {
        admin: true
      }
      const permisionId = "testPermissions"
      const permissionsMock = {
        "name": "permiso de prueba",
        "description": "solo crea contenido en la ruta dePrueba",
        "roles": {
          "guest2": {
            "name": "Invitado superior",
            "description": ""
          }
        },
        "resources": {
          "dePrueba": {
            "write": "UC",
            "read": true
          }
        }
      }

      const wrapperd = wrap(_createUser);
      const userRecord = await wrapperd({ ...userMock, roles }, {
        auth: {
          uid: 'adminTest' // only for real time database functions
        },
      });

      const documentsPath = ref(getUserAth(true, userRecord.uid), "permissions/" + permisionId);

      await assertSucceeds(set(documentsPath, permissionsMock));
      auth.deleteUser(userRecord.uid);
      await admin.database().ref('permissions').child(permisionId).set(null);

    });
  });

  describe("DICTIONARY", () => {
    // Título en español: Crear un nuevo recurso en la base de datos
    // Título en inglés: Create a new resource in the database
    
    // Prueba unitaria: Crear un nuevo recurso en la base de datos
    
    // DADO que tengo una base de datos vacía
    // CUANDO creo un nuevo recurso con clave "<clave>" y datos "<datos>"
    // ENTONCES el recurso con clave "<clave>" y datos "<datos>" se agrega correctamente a la base de datos
    it("Create a new resource in the database", async () => {
      const newPathDataMock = dictionaryBase.authorizations;
      await admin.database().ref('resources').child("pathCreated").set(newPathDataMock);
      const newPathDataDatabase = await (await admin.database().ref('resources').child("pathCreated").once('value')).val();

      assert.deepEqual(newPathDataDatabase, newPathDataMock);
    });
    
    // Título en español: Leer los datos de un recurso en la base de datos
    // Título en inglés: Read data of a resource in the database
    
    // DADO que tengo una base de datos con el recurso clave "<clave>" y datos "<datos>"
    // CUANDO leo los datos del recurso con clave "<clave>"
    // ENTONCES obtengo los datos "<datos>" del recurso solicitado
    it("Read data of a resource in the database", async () => {
      const key = "authorizations"
      const dataExpected = dictionaryBase[key];
      
      const data = await (await admin.database().ref("resources").child(key).once('value')).val();

      assert.deepEqual(data, dataExpected);
    });
    // Título en español: Actualizar los datos de un recurso en la base de datos
    // Título en inglés: Update data of a resource in the database
    
    // DADO que tengo una base de datos con el recurso clave "<clave>" y datos "<datos>"
    // CUANDO actualizo los datos del recurso con clave "<clave>" a los nuevos datos "<nuevos_datos>"
    // ENTONCES los datos del recurso con clave "<clave>" se actualizan correctamente en la base de datos

    it("Update data of a resource in the database", async () => {
      //allAccess mock 
      const key = "authorizations"
      const dataExpected = dictionaryBase[key];
      
      const data = await (await admin.database().ref("resources").child(key).once('value')).val();

      assert.deepEqual(data, dataExpected);
    });


  });

  describe("CREATE USER", () => {
    it("create user successfully", async () => {
      const userDataPrepare = {
        email: "email1@gmail.com",
        displayName: "user guest and guest1",
        // emailVerified: false,
        // phoneNumber: "+5730021312311",
        // password: "secretPassword",
        // photoURL: "http://www.example.com/12345678/photo.png",
        // disabled: "",

      };
      const roles = {
        guest: true,
        guest2: true
      }

      const wrapperd = wrap(_createUser);
      const userRecord = await wrapperd({ ...userDataPrepare, roles }, {
        auth: {
          uid: 'adminTest' // only for real time database functions
        },
      });
      //console.log("resultado => ", userRecord);
      const authorizationsExpected = {
        "clients": {
          "read": true,
          "write": "CU"
        },
        "employes": {
          "read": true,
          "write": "CU"
        },
        "paths": {
          "read": true,
          "write": false
        },
        "permissions": {
          "read": true,
          "write": false
        },
        "posts": {
          "read": true,
          "write": "CU"
        },
        "roles": {
          "read": true,
          "write": false
        },
        "shippings": {
          "read": true,
          "write": true
        },
        "users": {
          "read": true,
          "write": false
        }
      };
      const usersRecord = await (await admin.database().ref("users/" + userRecord.uid).once("value")).val();
      // console.log("comparando path users");

      assert.deepEqual(usersRecord, { ...userDataPrepare, roles });
      const profilesRecord = await (await admin.database().ref("profiles/" + userRecord.uid).once("value")).val();
      // console.log("comparando path profiles");

      assert.deepEqual(profilesRecord, userDataPrepare);
      const authorizationsRecord = await (await admin.database().ref("authorizations/" + userRecord.uid).once("value")).val();
      console.log("comparando path authorizations");

      assert.deepEqual(authorizationsRecord, authorizationsExpected);
      const updates = {
        ["users/" + userRecord.uid]: null,
        ["profiles/" + userRecord.uid]: null,
        ["authorizations/" + userRecord.uid]: null
      }
      await admin.database().ref().update(updates);
      auth.deleteUser(userRecord.uid);


    }).timeout(10000);

    it("dont create user with wrong credencial ", async () => {
      const userDataPrepare = {
        email: "email@gmail.com",
        displayName: "user guest and guest1",
        // emailVerified: false,
        // phoneNumber: "+5730021312311",
        // password: "secretPassword",
        // photoURL: "http://www.example.com/12345678/photo.png",
        // disabled: "",

      };
      const roles = {
        guest: true,
        guest2: true
      }

      const wrapperd = wrap(_createUser);

      try {
        console.log("•••entrando a la llamada");
        const userRecord = await wrapperd({ ...userDataPrepare, roles }, {
          auth: {
            uid: 'uidNonAuthorizated' // only for real time database functions
          },
        });
        //console.log("resultado ", userRecord)
        // return result;
        //console.log("•••todo sali[o bien")
        const updates = {
          ["users/" + userRecord.uid]: null,
          ["profiles/" + userRecord.uid]: null,
          ["authorizations/" + userRecord.uid]: null
        }
        await admin.database().ref().update(updates);
        auth.deleteUser(userRecord.uid);
        assert.fail();
      } catch (e: any) {
        console.log("entr[o al catch")
        assert.equal(e.code, 'permission-denied');
      }


    }).timeout(10000);

  });

});


after(async () => {
  testEnv ? await testEnv.clearDatabase() : null;
  testEnv ? await testEnv.clearStorage() : null;
  testEnv ? await testEnv.cleanup() : null;
});

