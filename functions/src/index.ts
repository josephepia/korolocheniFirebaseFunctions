/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import _ from "lodash";
// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript

admin.initializeApp({
  databaseURL: "http://127.0.0.1:9000/?ns=korolochenni-default-rtdb",
});

const sanitizeAuthorizations = async (userData:any)=>{
  let authFinale = {};

  // analizar lista roles y permisos, encontrar similitud
  // y construir una matriz de autenticacion basado en ello

  // lectura de roles y permisos base
  const permissions = await (await admin.database().ref("permissions").once("value")).val();
  // const roles = await admin.database().ref("roles").once("value");

  const keysRolesUser = _.keys(userData.roles);
  const beforeAuthorizationFinale:any[] = [];
  _.forEach(permissions, (value:any)=>{
    const keysRolesPermissionHere = Object.keys(value.roles);
    if (_.intersection(keysRolesUser, keysRolesPermissionHere).length > 0) {
      // console.log("indice de permiso => ", per);
      const resources = value.resources;
      // beforeAuthorizationFinale.push(resources);
      _.forEach(_.keys(resources), (idPat) =>
        beforeAuthorizationFinale.push({[idPat]: resources[idPat]})
      );
    }
  });

  const authItem:any = {};

  authFinale = _.reduce(
      beforeAuthorizationFinale,
      (preview:any, current) => {
        const currentPath = _.keys(current)[0];

        if (!authItem[currentPath]) {
          authItem[currentPath] = {
            read: false,
            write: false,
          };
        }
        if (preview[currentPath]?.read || current[currentPath].read) {
          authItem[currentPath]["read"] = true;
        }

        const currentWrite = current[currentPath].write;
        const previewWrite = preview[currentPath]?.write;

        if (currentWrite === true) {
          authItem[currentPath]["write"] = true;
        } else if (currentWrite !== false) {
          let prevTemp = previewWrite;
          if (previewWrite === true) {
            prevTemp = "CUD";
          }
          if (previewWrite === false) {
            prevTemp = "";
          }

          let sortedWord:any = _.sortBy(
              _.union([...(prevTemp || [])], [...currentWrite])
          ).join("");

          if (sortedWord == "CDU") {
            sortedWord = true;
          }

          authItem[currentPath]["write"] = sortedWord;
        }

        return {...preview, ...authItem};
      },
      {}
  );

  return authFinale;
};

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// export const createUserAuthTrigger = functions.auth.user().onCreate(async (user, context)=>{
//   const updates:any ={};


//   return admin.database().ref().update(updates);
// });

export const createUser = functions.https.onCall(async (dataUser, context)=>{
  const uid = context.auth?.uid || "";
  // console.log("context auth -> ", context);
  // console.log("dataUser received -> ", dataUser);
  // pendiente permitir al super admin realizar esta acci[on]
  const createPrivilege = await ((await admin.database().ref("authorizations/"+uid+"/users").once("value")).val())?.write || false;
  const isCreatable = (createPrivilege === true ? true : ([...([createPrivilege] || [])]).includes("U"));
  if (!isCreatable) {
    throw new functions.https.HttpsError("permission-denied", "el usuario no tiene privilegios");
  }

  const userDataPrepare:any = _.omitBy(_.pick(dataUser, ["email", "emailVerified", "phoneNumber", "password", "displayName", "photoURL", "disabled"]), _.isNull);
  const userCreated = await admin.auth().createUser(userDataPrepare);
  const updates:any = {};
  updates["users/"+userCreated.uid+"/displayName"] = userCreated.displayName;
  updates["users/"+userCreated.uid+"/email"] = userCreated.email;
  updates["users/"+userCreated.uid+"/phoneNumber"] = userCreated.phoneNumber || null;
  updates["users/"+userCreated.uid+"/photoURL"] = userCreated.photoURL || null;

  updates["profiles/"+userCreated.uid+"/displayName"] = userCreated.displayName;
  updates["profiles/"+userCreated.uid+"/email"] = userCreated.email;
  updates["profiles/"+userCreated.uid+"/phoneNumber"] = userCreated.phoneNumber || null;
  updates["profiles/"+userCreated.uid+"/photoURL"] = userCreated.photoURL || null;
  updates["users/"+userCreated.uid+"/roles"] = dataUser?.roles;

  updates["authorizations/"+userCreated.uid] = await sanitizeAuthorizations(dataUser);
  // console.log(" object updates -> ", updates);
  await admin.database().ref().update(updates);
  return userCreated;
});

export const updateUser = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || "";
  const updatePrivilege = await ((await admin.database().ref("authorizations").child(uid).child("users").once("value")).val())?.write || false;
  const isUpgradable = (updatePrivilege === true ? true : ([...([updatePrivilege] || [])]).includes("U"));
  if (isUpgradable) {
    const updates:any = {};
    updates["users"+uid] = data;
    updates["profiles"+uid] = data;
    await admin.database().ref().update(updates);
  } else {
    throw new Error("no cuenta con privilegios suficientes");
  }
  return null;
});

export const agregarRol = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || "";
  // Set custom user claims on this newly created user.
  try {
    const agregdo = await admin.auth().setCustomUserClaims(uid, {
      admin: true,
    });
    console.log("rol agregado ", agregdo);
  } catch (error) {
    console.log("error al agregar rol -> ", error );
  }
});

export const createSuperAdmin = functions.database.ref("superAdmins/{userId}")
    .onCreate(async (snapshot, context) => {
      // const userId = context.params.userId;


      // try {
      //   const setClaims= await admin.auth().setCustomUserClaims(uid, claims);
      // } catch (error) {
      //   console.log("algo");
      // }
      console.log("usuario super admin creado en la base de datos");
      return null;
    });

