const admin = require('firebase-admin'); // Import admin from Firebase Admin SDK

const { db, bucket } = require('../utils/firebase/firebase');
const { v4: uuidv4 } = require('uuid');

const uploadImage = async (req, res) => {
    const { base64Image, collectionName, userId } = req.body;

    if (!base64Image || !collectionName || !userId) {
        return res.status(400).send("Incomplete Data");
    }

    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    const uniqueFileName = `${uuidv4()}`;
    const file = bucket.file(uniqueFileName);

    try {
        await file.save(buffer, {
            metadata: {
                contentType: 'image/jpeg'
            },
            public: true,
        });

        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;

        // Store metadata in Firestore
        const imageCollection = db.collection('users').doc(userId);
        const userImage = imageCollection.collection(collectionName);

        const snapshot = await userImage.get();
        const count = snapshot.size; 

        const userImageCollection = userImage.doc(count.toString());

        await userImageCollection.set({
            datatype: "image",
            fileName: uniqueFileName,
            fileUrl: fileUrl,
            uploadTimestamp: admin.firestore.FieldValue.serverTimestamp(), // Correct usage
        });

        return res.send({ fileUrl });
    } catch (error) {
        console.log(error);
        return res.status(500).send('Failed to upload image');
    }
}

const uploadText = async (req, res) => {
    const { text, collectionName, userId } = req.body;

    if (!text || !collectionName || !userId) {
        return res.status(400).send("Missing data");
    }

    const uniqueFileName = `${uuidv4()}`;
    const textContent = text;
    const destination = `${uniqueFileName}.txt`;

    try {

        const file = bucket.file(destination);
        await file.save(textContent,{
            metadata: {
                contentType: 'text/plain',
            },
        });

        const [url] = await file.getSignedUrl({
            action: 'read',
            expires: '03-01-2500',
          });

        const textCollection = db.collection('users').doc(userId);
        const userText = textCollection.collection(collectionName);

        const snapshot = await userText.get();
        const count = snapshot.size;

        const userTextCollection = userText.doc(count.toString());

        await userTextCollection.set({
            datatype: "text",
            fileName: uniqueFileName,
            fileUrl: url,
            uploadTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        return res.send(`${url}`);  

    }
    catch(error){
        console.log(error);
        return res.status(400).send("Unable to store text");
    }
}

module.exports = { uploadImage, uploadText };
