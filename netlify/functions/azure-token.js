// ============================================================
//  azure-token.js
//  Role : donner au navigateur un "ticket temporaire" (token)
//  pour utiliser Azure Speech, SANS jamais reveler la cle secrete.
//
//  La cle reste dans les variables d'environnement Netlify :
//    - AZURE_SPEECH_KEY     (la cle secrete)
//    - AZURE_SPEECH_REGION  (ex : francecentral)
// ============================================================

exports.handler = async function () {
  const KEY    = process.env.AZURE_SPEECH_KEY;
  const REGION = process.env.AZURE_SPEECH_REGION || 'francecentral';

  // Si la cle n'est pas configuree dans Netlify, on previent clairement.
  if (!KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AZURE_SPEECH_KEY absente des variables Netlify." })
    };
  }

  try {
    // On demande a Azure un jeton d'acces valable ~10 minutes.
    const url = 'https://' + REGION + '.api.cognitive.microsoft.com/sts/v1.0/issueToken';
    const reponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!reponse.ok) {
      const detail = await reponse.text();
      return {
        statusCode: reponse.status,
        body: JSON.stringify({ error: "Azure a refuse la demande de jeton.", detail })
      };
    }

    const token = await reponse.text();

    // On renvoie au navigateur uniquement le jeton + la region.
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, region: REGION })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erreur serveur : " + (err.message || String(err)) })
    };
  }
};
