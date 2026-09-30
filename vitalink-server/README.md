# VITALINK SERVER

Serveur central (API) pour l'application patient et le futur bureau des hopitaux.

## Installation (une seule fois)

1. Ouvrir ce dossier dans VS Code
2. Ouvrir le terminal (Ctrl + `)
3. Taper :
```
npm install
```
(necessite internet, une seule fois)

## Creer un hopital de test

```
npm run seed
```
Ca affiche un code d'acces genere pour l'hopital de test.

## Lancer le serveur

```
npm start
```
Le serveur tourne alors sur http://localhost:4000 (aucun internet requis ensuite).

## Verifier que ca marche

Ouvrir http://localhost:4000/api/health dans un navigateur : doit afficher {"status":"ok"}

## Endpoints principaux

- GET  /api/hospitals?q=cnhu       -> recherche d'hopitaux
- GET  /api/hospitals/:id          -> details + services d'un hopital
- POST /api/auth/register          -> creation de compte patient
- POST /api/auth/login             -> connexion patient
- POST /api/bookings                -> rendez-vous / demande d'examen
- POST /api/results/check           -> verifier un resultat

## Prochaine etape

Une fois teste, on modifiera script.js de l'application patient pour qu'il
appelle ces adresses (http://localhost:4000/api/...) au lieu d'utiliser
hospitals.js. On construira ensuite le site/bureau des hopitaux qui utilisera
ce meme serveur.
