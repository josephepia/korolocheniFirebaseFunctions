/* eslint-disable max-len */
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import _ from "lodash";
// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript

admin.initializeApp({
  databaseURL: "http://127.0.0.1:9000/?ns=korolochenni-default-rtdb",
});


// const dictiionaryBase = {
//   paths: {
//     description: "",
//     isPublic: false,
//     isQueryable: true,
//     isRestricted: true,
//   },
//   permissions: {
//     description: "",
//     isPublic: false,
//     isQueryable: true,
//     isRestricted: false,
//   },
//   roles: {
//     description: "",
//     isPublic: false,
//     isQueryable: true,
//     isRestricted: false,
//   },
//   authorizations: {
//     description: "",
//     isPublic: false,
//     isQueryable: false,
//     isRestricted: true,
//   },
//   posts: {
//     description: "",
//     isPublic: true,
//     isQueryable: true,
//     isRestricted: false,
//   },

// };

// const permissionsBase = {
//   allAcces: {
//     name: "Acceso total",
//     description: "Permiso de escritura y lectura toltal a todas los recursos no restringidos",
//     resources: {
//       paths: {
//         write: true,
//         read: true,
//       },
//       permissions: {
//         write: true,
//         read: true,
//       },
//       roles: {
//         write: true,
//         read: true,
//       },
//     },
//   },
//   readOnly: {
//     name: "Solo lectura",
//     description: "",
//     resources: {
//       paths: {
//         write: false,
//         read: true,
//       },
//       permissions: {
//         write: false,
//         read: true,
//       },
//       roles: {
//         write: false,
//         read: true,
//       },
//     },
//   },
//   readOnlyPublic: {
//     name: "Solo lectura",
//     description: "Solo lectura de recursos públicos",
//     resources: {
//       posts: {
//         write: false,
//         read: true,
//       },
//     },
//   },
// };

// const rolesBase = {
//   admin: {
//     name: "Administrador",
//     description: "",
//     permissions: {
//       allAccess: true,
//     },
//   },
//   guest: {
//     name: "Invitado",
//     description: "",
//     permissions: {
//       post: true,
//     },
//   },
// };
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

  // console.log('list before auth -?', beforeAuthorizationFinale);
  // console.log("list before auth Two", beforeAuthorizationFinale);
  // _.forEach(beforeAuthorizationFinale,(element,index)=>{
  //   authFinale = _.unionWith(element,beforeAuthorizationFinale[index+1],(a,b)=>{

  //   })
  // })
  const authItem:any = {};

  authFinale = _.reduce(
      beforeAuthorizationFinale,
      (preview:any, current) => {
        const currentPath = _.keys(current)[0];
        // console.log("formateando la ruta => ", currentPath);
        // console.log("current => ", current);
        // console.log("current valores => ", current[currentPath]);
        // authItem[]

        if (!authItem[currentPath]) {
          authItem[currentPath] = {
            read: false,
            write: false,
          };
        }
        if (preview[currentPath]?.read || current[currentPath].read) {
          // console.log(
          //     `read preview -> ${preview[currentPath]?.read} o ${current[currentPath].read} contienen verdadero`
          // );
          authItem[currentPath]["read"] = true;
        } else {
          // console.log(
          //     `read preview -> ${preview[currentPath]?.read} o ${current[currentPath].read} contienen falso ambos`
          // );

          // authItem[currentPath]['read'] = false;
        }

        const currentWrite = current[currentPath].write;
        const previewWrite = preview[currentPath]?.write;
        // console.log(
        //     `write old is ${previewWrite} write curret is ${currentWrite}`
        // );

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
          console.log("sorted => ", sortedWord);

          authItem[currentPath]["write"] = sortedWord;
        }
        // console.log(" se cosidera -> ", authItem);
        return {...preview, ...authItem};
      },
      {}
  );

  console.log("prueba de authorizations finale => ", authFinale);
  return authFinale;
  // await admin.database().ref("authorizations").child(userData.uid).update(authFinale);
};

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const createUserAuthTrigger = functions.auth.user().onCreate(async (user, context)=>{
  console.log("context create user ", context);
  console.log("user create user ", user);
  // const newUserDatabase = {
  //   displayName: user.displayName,
  //   email: user.email,
  //   phoneNumber: user.phoneNumber,
  //   photoURL: user.photoURL,
  //   // "roles": {
  //   //   "guest": true,
  //   // },,
  //   creadoPorOriginal: false,
  //   actualizadoPor: "onCreateTrriger",
  // };

  // const newUserProfile = {
  //   "displayName": user.displayName,
  //   "email": user.email,
  //   "phoneNumber": user.phoneNumber,
  //   "photoURL": user.photoURL,
  // };

  const updates:any ={};
  updates["users/"+user.uid+"/displayName"] = user.displayName;
  updates["users/"+user.uid+"/email"] = user.email;
  updates["users/"+user.uid+"/phoneNumber"] = user.phoneNumber;
  updates["users/"+user.uid+"/photoURL"] = user.photoURL;

  updates["profiles/"+user.uid+"/displayName"] = user.displayName;
  updates["profiles/"+user.uid+"/email"] = user.email;
  updates["profiles/"+user.uid+"/phoneNumber"] = user.phoneNumber;
  updates["profiles/"+user.uid+"/photoURL"] = user.photoURL;
  console.log("preparado para agregar los roles");
  // updates["authorizations/"+user.uid] = await sanitizeAuthorizations(newUserDatabase);

  return admin.database().ref().update(updates);
});

export const createUser = functions.https.onCall(async (dataUser, context)=>{
  const uid = context.auth?.uid || "";
  console.log("context auth -> ", context);
  console.log("dataUser received -> ", dataUser);
  // pendiente permitir al super admin realizar esta acci[on]
  const createPrivilege = await ((await admin.database().ref("authorizations/"+uid+"/users").once("value")).val())?.write || false;
  const isCreatable = (createPrivilege === true ? true : ([...([createPrivilege] || [])]).includes("U"));
  if (!isCreatable) {
    throw new functions.https.HttpsError("permission-denied", "el usuario no tiene privilegios");
  }

  // const userDataPrepare:any = {
  //   email: dataUser["email"] || null,
  //   emailVerified: dataUser["emailVerified"] || false,
  //   phoneNumber: dataUser["phoneNumber"] || null,
  //   password: dataUser["password"] || null,
  //   displayName: dataUser["displayName"] || "",
  //   photoURL: dataUser["photoURL"] || "",
  //   disabled: dataUser["disabled"] || false,
  // };
  const userDataPrepare:any = _.omitBy(_.pick(dataUser, ["email", "emailVerified", "phoneNumber", "password", "displayName", "photoURL", "disabled"]), _.isNull);
  const userCreated = await admin.auth().createUser(userDataPrepare);
  const updates:any = {};
  // userDataPrepare["roles"] = dataUser?.roles || {};
  // updates["users/"+userCreated.uid+"/displayName"] = dataUser.displayName;
  // updates["users/"+userCreated.uid+"/email"] = dataUser.email;
  // updates["users/"+userCreated.uid+"/phoneNumber"] = dataUser.phoneNumber;
  // updates["users/"+userCreated.uid+"/photoURL"] = dataUser.photoURL;
  // updates["users/"+userCreated.uid+"/photoURL"] = dataUser.photoURL;
  updates["users/"+userCreated.uid+"/roles"] = dataUser?.roles;
  // updates["users/"+userCreated.uid+"/actualizadoPor"] = "original";
  // updates["users/"+userCreated.uid+"/creadoPorOriginal"] = true;
  // updates["users/"+userCreated.uid] = userDataPrepare;
  updates["authorizations/"+userCreated.uid] = await sanitizeAuthorizations(dataUser);
  console.log(" object updates -> ", updates);
  return admin.database().ref().update(updates);
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

