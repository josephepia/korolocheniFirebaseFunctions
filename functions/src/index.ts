import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript
//
admin.initializeApp();

export const helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

export const agregarRol = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || "";
  // Set custom user claims on this newly created user.
  try {
    const agregdo = await admin.auth().setCustomUserClaims(uid, {
      admin: true,
    });
    console.log('rol agregado ', agregdo);
  } catch (error) {
    console.log('error al agregar rol -> ',error );
    
  }
  
});

export const createSuperAdmin = functions.database.ref("superAdmins/{userId}")
    .onCreate(async (snapshot,context) => {

      const userId = context.params.userId;

      
      try {
        const setClaims= await admin.auth().setCustomUserClaims(uid, claims)
      } catch (error) {
        
      }
      return null;
    });

