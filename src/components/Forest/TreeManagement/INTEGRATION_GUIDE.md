# Guide d'intégration TreeManagement dans App.jsx

## Structure des fichiers

```
src/
├── components/
│   └── Forest/
│       └── TreeManagement/
│           ├── TreeManagement.jsx       # Composant principal
│           ├── TreeForm.jsx             # Formulaire
│           ├── TreeList.jsx             # Liste
│           ├── TreeStats.jsx            # Statistiques
│           ├── BulkImportModal.jsx      # Import CSV
│           └── SearchModal.jsx          # Recherche
├── hooks/
│   ├── useTreeData.js                   # Hook gestion data
│   └── useMapbox.js                     # Hook Mapbox
└── services/
    └── treeService.js                   # API calls
```

## Import dans App.jsx

Le composant TreeManagement est **déjà importé** dans ton App.jsx :

```javascript
import TreeManagement from './components/Forest/TreeManagement.jsx';
```

## Route existante

```javascript
{
  path: "/treemanager",
  component: <TreeManagement />,
  adminOnly: false,
  allowedRoles: ['admin', 'forest']
}
```

## Installation

1. **Copier les dossiers** dans ton projet :
   - Copie `components/TreeManagement/` → `src/components/Forest/TreeManagement/`
   - Copie `hooks/` → `src/hooks/`
   - Copie `services/` → `src/services/`

2. **Remplacer l'ancien fichier** :
   - Supprime `src/components/Forest/TreeManagement.jsx` (ancien fichier monolithique)
   - Les nouveaux fichiers sont dans `src/components/Forest/TreeManagement/`

3. **Mettre à jour l'import dans App.jsx** (ligne 69) :
   ```javascript
   // Ancien import (à remplacer)
   import TreeManagement from './components/Forest/TreeManagement.jsx';
   
   // Nouvel import
   import TreeManagement from './components/Forest/TreeManagement/TreeManagement.jsx';
   ```

## Dépendances requises

Assure-toi d'avoir ces packages (déjà installés normalement) :
```bash
npm install mapbox-gl lucide-react sweetalert2
```

## Backend

Ton backend Flask `api_tree.py` reste **inchangé**. Les endpoints utilisés :
- GET `/api/tree/` - Liste paginée
- GET `/api/tree/all` - Tous les arbres
- GET `/api/tree/<id>` - Un arbre
- POST `/api/tree/create` - Créer
- PUT `/api/tree/<id>` - Mettre à jour
- DELETE `/api/tree/<id>` - Supprimer
- GET `/api/tree/stats` - Statistiques
- POST `/api/tree/bulk-create` - Import CSV
- GET `/api/forest/` - Liste des forêts

## Accès

L'accès est contrôlé par UserTypeRoute :
- **Admin** : Accès total
- **Forest** : Accès total
- **Autres** : Accès refusé

## Test

Navigue vers `/treemanager` après connexion avec un compte admin ou forest.
