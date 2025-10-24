
┌─────────────────────┐
│   MOTEUR/MACHINE    │
│                     │
│    [VIBRATION]  ←── Collé directement sur le CARTER MÉTALLIQUE
│    ════════════     (partie rigide, non-mobile)
│         ▲           
│         │           
│    Zone métal       
│    rigide           
└─────────────────────┘

Distance du centre de rotation: 3-10 cm
Orientation: Peu importe (détecte toutes directions)

#### **Règles de Placement:**
```
✅ À FAIRE:
├─ Coller sur surface MÉTALLIQUE propre
├─ Près de la source vibration (moteur, roulement)
├─ Sur partie FIXE (pas rotative)
├─ Utiliser double-face VHB ou vis
└─ Nettoyer surface (alcool) avant collage

❌ ÉVITER:
├─ Sur plastique (amortit vibrations)
├─ Sur partie mobile (câbles arrachés)
├─ Trop loin du moteur (>30cm)
└─ Sur zone huileuse/grasse
```

#### **Exemples Concrets:**

**Ventilateur de bureau:**
```
        [Hélices]
            │
      ┌─────┴─────┐
      │  Moteur   │
      │    [📳]   │ ← ICI: Sur boîtier moteur
      │           │
      └───────────┘
       Support fixe
```

**Pompe à eau:**
```
    Sortie eau
        ↑
   ┌────┴────┐
   │ Corps   │
   │ pompe   │ ← ICI: Sur corps fonte
   │  [📳]   │
   └─────────┘
   Moteur bas
```

**Machine à coudre:**
```
      Tête couture
          │
    ┌─────┴─────┐
    │   [📳]    │ ← ICI: Sur bâti métallique
    │  Carter   │    près de l'aiguille
    └───────────┘
```


## **CAPTEUR 2: MPU6050 (Accéléromètre/Gyroscope)**

### **Où le placer?**

#### **Position Idéale:**
```
┌─────────────────────┐
│   PARTIE MOBILE     │
│   ou VIBRATION MAX  │
│                     │
│      [MPU6050]  ←── Sur support/châssis
│      ╔═══════╗      (orientation importante!)
│      ║ ┌─┐   ║
│      ║ │X│→  ║ ← Axe X = direction mouvement principal
│      ║ └─┘   ║
│      ║  Y↓   ║ ← Axe Y = perpendiculaire
│      ╚═══════╝
│         Z⊙   ← Axe Z = vertical (gravité)
└─────────────────────┘

Orientation: CRITIQUE pour bonnes mesures!
Fixation: RIGIDE (vis ou super-glue)
```

#### **Règles d'Orientation:**
```
Axe X: Direction rotation/mouvement principal
Axe Y: Direction latérale
Axe Z: Vertical (gravité = 1g au repos)

Exemple moteur horizontal:
   X → sens rotation
   Y → perpendiculaire à axe moteur
   Z → vers le haut
```

#### **Exemples Concrets:**

**Ventilateur:**
```
Vue de côté:
        Hélice
          ↻
    ┌─────────┐
    │  Moteur │
    │         │
    │ [MPU]   │ ← ICI: Collé sur face avant moteur
    │  X→     │    X aligné avec axe rotation
    │  Z↑     │    Z vers le haut
    └─────────┘
```

**Convoyeur:**
```
Vue de dessus:
    ← Sens défilement bande
    ═════════════════
    [MPU]            ← ICI: Sur châssis fixe
     X→                   X = sens bande
     Y↓                   Y = largeur
```

**Pompe centrifuge:**
```
    Sortie
      ↑
   ┌──┴──┐
   │[MPU]│ ← ICI: Sur bride sortie
   │ X↑  │    X = axe pompe
   │Z⊙   │    Z = perpendiculaire (tangent)
   └─────┘
```

---

## **CAPTEUR 3: ULTRASON HC-SR04**

### **Où le placer?**

#### **Position Idéale:**
```
    [HC-SR04]
    ┌───────┐
    │ T  R  │  ← Émetteur (T) et Récepteur (R)
    └───┬───┘
        │ Faisceau ultrason (15° cône)
        │
        ↓
    ═════════  ← Surface cible (perpendiculaire)
    Partie mobile
    
Distance optimale: 5-100 cm
Angle: Perpendiculaire (±5°) sinon erreurs!
```

#### **Règles de Placement:**
```
✅ À FAIRE:
├─ Perpendiculaire à la surface (90°)
├─ Surface cible PLANE et RIGIDE
├─ Distance 5-100 cm (sweet spot: 10-50 cm)
├─ Protéger de poussière/huile
└─ Loin de sources ultrason (autres capteurs)

❌ ÉVITER:
├─ Angle oblique (>10°)
├─ Surface courbe/rugueuse
├─ Matériaux absorbants (mousse, tissu)
├─ Trop près (<5cm) ou trop loin (>2m)
└─ Objets dans le faisceau
```

#### **Exemples Concrets:**

**Convoyeur (mesure jeu bande):**
```
Support fixe
    │
    │  [HC-SR04]
    │   │T│R│
    ▼   └─┴─┘
        │ │ Faisceau
        ▼ ▼
    ═════════ Bande transporteuse (cible)
    
Distance change si bande use ou se détend
```

**Ventilateur (mesure vibration amplitude):**
```
    [HC-SR04]
       T R
       │││
       ▼▼▼
    ┌──────┐
    │Carter│ ← Face arrière moteur
    │moteur│    Distance varie si vibrations
    └──────┘
    
Distance nominale: 8.5 cm
Vibration: ±3mm détectable
```

**Porte coulissante (détection position):**
```
Mur fixe
  │
  │ [HC-SR04]
  │    TR
  │    ││
  │    ▼▼
  │  ╔════╗
  │  ║    ║ Porte mobile
  │  ║    ║
  └──╚════╝
  
Distance varie selon position porte
```

**Réservoir liquide (niveau):**
```
    Couvercle
    ┌─────────┐
    │[HC-SR04]│ Monté sur couvercle
    │   TR   │
    │   ││   │
    │   ▼▼   │
    │ ~~~~~~ │ Surface liquide
    │ Liquide│
    └─────────┘
    
Distance = hauteur d'air (niveau inversé)
```

---

## **CAPTEUR 4: DHT11 (Température/Humidité)**

### **Où le placer?**

#### **Position Idéale:**
```
    [DHT11]
    ╔═════╗
    ║ ▓▓▓ ║ ← Grille ventilation (pas obstruer!)
    ╚═════╝
      │
      ↓ À proximité de la source chaleur
    
Distance de la machine: 5-15 cm
Ventilation: LIBRE (pas dans boîtier fermé)
```

#### **Règles de Placement:**
```
✅ À FAIRE:
├─ Près de la source chaleur (moteur)
├─ Air libre (bonne circulation)
├─ À l'ombre (pas soleil direct)
├─ Protégé de projections eau/huile
└─ Orientation grille vers le bas (évite poussière)

❌ ÉVITER:
├─ Dans boîtier fermé ESP32 (auto-chauffe)
├─ Soleil direct (fausse température)
├─ Flux d'air forcé direct (ventilateur)
├─ Contact métallique (conducteur chaleur)
└─ Zone humide condensante
```

#### **Exemples Concrets:**

**Moteur électrique:**
```
    Ventilateur moteur
           ↓
        ╔═══╗
        ║   ║
    ┌───╨───┐
    │[DHT11]│ ← ICI: 10cm au-dessus moteur
    │       │    Dans flux air chaud sortant
    │ Moteur│
    └───────┘
    
Température augmente si:
- Roulement friction
- Bobinage défaut
- Ventilation bloquée
```

**Pompe hydraulique:**
```
    Carter pompe
    ┌─────────┐
    │  [DHT]  │ ← ICI: Collé sur carter (pas dans l'eau!)
    │  ═════  │    Mesure température carter
    │ Pompe   │
    └─────────┘
    
Surchauffe = friction interne ou cavitation
```

**Armoire électrique:**
```
    Porte armoire
    ┌───────────┐
    │           │
    │  [DHT11] │ ← ICI: Mi-hauteur, air libre
    │           │    (chaleur monte)
    │ Disjonct. │
    │ Relais    │
    └───────────┘
    
Humidité haute = risque court-circuit
```

**Compresseur d'air:**
```
      Sortie air comprimé
            ↑
         ┌──┴──┐
    [DHT]│Tête │ ← ICI: Près sortie chaude
         │Comp.│
         └─────┘
         Moteur
    
Température + humidité = détection fuite
```

---

## **CAPTEUR 5: HALL EFFECT SS49E (Électromagnétique)**

### **Où le placer?**

#### **Position Idéale:**
```
    Bobine moteur
    ┌─────────┐
    │ ≋≋≋≋≋≋≋ │ ← Champ magnétique
    │         │
    │  [HALL] │ ← ICI: Face capteur vers bobine
    │  ╔═╗    │    Distance: 0.5-3 cm
    │  ║⊙║   │
    │  ╚═╝    │
    └─────────┘
    
Orientation: Face sensible VERS la source EM
Distance: Plus proche = plus sensible
```

#### **Règles de Placement:**
```
✅ À FAIRE:
├─ Face capteur parallèle au champ magnétique
├─ Près bobine/moteur (0.5-3 cm)
├─ Fixation STABLE (pas bouger)
├─ Loin de métaux ferreux (perturbent champ)
└─ Calibrer à chaque installation (offset)

❌ ÉVITER:
├─ Capteur perpendiculaire au champ
├─ Trop loin (>10 cm = signal faible)
├─ Dans flux mécanique (vibrations violentes)
├─ Près aimants permanents puissants
└─ Multiples capteurs Hall proches (<5 cm)
```

#### **Exemples Concrets:**

**Moteur électrique triphasé:**
```
Vue de face moteur:

    ┌─────────────┐
    │   Bobine    │
    │   Phase A   │ Champ EM ↓↓↓
    │             │
    │   [SS49E]   │ ← ICI: 2cm en face bobine
    │    ╔═╗      │    Face capteur vers stator
    │    ║⊙║      │
    │    ╚═╝      │
    └─────────────┘
    
Détecte:
- Asymétrie phases (défaut bobinage)
- Court-circuit (pic EM)
- Déséquilibre charge
```

**Relais/Contacteur:**
```
    Bobine relais
       ┌─┐
       │ │ ≋≋≋ Champ EM
    ┌──┴─┴──┐
    │[HALL] │ ← ICI: Collé contre bobine
    │       │    Détecte état ON/OFF + usure
    └───────┘
    
Usure contacteur = champ irrégulier
```

**Moteur brushless (sans balais):**
```
    Rotor avec aimants
          ↻
    ╔═══════════╗
    ║  ▓  ▓  ▓  ║ Aimants permanents
    ╚═════╤═════╝
          │
       [HALL] ← ICI: 1cm sous rotor
       ╔═╗       Détecte passage aimants
       ║⊙║       (compte tours + anomalies)
       ╚═╝
       
Signal change si:
- Aimant descellé
- Roulement jeu
- Déséquilibre
```

**Transformateur:**
```
    Noyau magnétique
    ╔═════════╗
    ║ ≋≋≋≋≋≋≋ ║ Flux magnétique
    ║        ║
    ║ [HALL] ║ ← ICI: Sur noyau fer
    ║  ╔═╗   ║    Détecte saturation
    ╚══╚═╝═══╝
    
Anomalie = harmoniques 50Hz
```

---

## 🎯 **CONFIGURATION COMPLÈTE: Exemple Ventilateur**

### **Vue d'Ensemble:**
```
                  [AFFICHEUR 7-SEG]
                        │
    [MATRICE 8×8]       │      [ESP32]
         │              │         │
         └──────────────┴─────────┤
                                  │
                    ┌─────────────┴──────────────┐
                    │                            │
               Câbles vers capteurs         Alimentation
                    │                        5V + GND
                    ↓
                    
        ╔═══════════════════════════════════╗
        ║         VENTILATEUR               ║
        ║                                   ║
        ║         [DHT11]                   ║ ← 10cm au-dessus
        ║            ↓                      ║
        ║      ┌─────────┐                  ║
        ║      │ [MPU]   │ Hélice           ║
        ║      │  Z↑     │   ↻              ║
        ║   ┌──┤  X→    │──────┐            ║
        ║   │  └─────────┘      │           ║
        ║   │   Carter moteur   │           ║
        ║   │     [VIB]         │           ║ ← Vibration collé
        ║   │      ⚡            │          ║
        ║   │    [HALL]         │           ║ ← Hall 2cm face bobine
        ║   └───────────────────┘           ║
        ║         Support                   ║
        ║                                   ║
        ║   [HC-SR04] ← ← ← ← ←             ║ ← Ultrason 15cm face arrière
        ║      T R                          ║
        ╚═══════════════════════════════════╝
```

### **Distances Exactes:**
```
Capteur      │ Position              │ Distance du Centre
─────────────┼───────────────────────┼──────────────────
Vibration    │ Carter latéral moteur │ 5 cm
MPU6050      │ Face avant moteur     │ 8 cm  
Ultrason     │ Face arrière moteur   │ 15 cm (cible)
DHT11        │ Au-dessus moteur      │ 10 cm vertical
Hall SS49E   │ Face bobine           │ 2 cm
```

---

## 🔧 **FIXATION PRATIQUE**

### **Méthodes de Fixation par Capteur:**

#### **Vibration (SW-420):**
```
Méthode 1: Double-face VHB 3M
├─ Nettoyer surface alcool
├─ Coller pastille VHB sur capteur
├─ Presser fort 30 sec
└─ Attendre 24h séchage complet

Méthode 2: Vis + écrou
├─ Percer trou M3 dans carter (si autorisé)
├─ Visser capteur
└─ Plus fiable mais invasif

Méthode 3: Pâte thermique + serflex
├─ Appliquer pâte thermique
├─ Maintenir avec collier serflex
└─ Pour tests temporaires 
```

#### **MPU6050:**
```
Super-glue cyanoacrylate (recommandé)
├─ 1 goutte sur module
├─ Presser 1 minute
├─ Fixation permanente + rigide
└─ Orientation critique respectée

Alternative: Support imprimé 3D
├─ Modèle STL sur Thingiverse
├─ Vissé sur machine
└─ MPU clipsé dedans
```

#### **HC-SR04:**
```
Support orientable (DIY)
┌────────────┐
│ [HC-SR04] │
│  T    R   │
└─────┬─────┘
      │ Rotule orientable
   ───┴───
   Pince/vis
   
Ou support imprimé 3D avec angle réglable
```

#### **DHT11:**
```
Suspendre par fil
  [DHT11]
     │
  ───┴───  Fil nylon
     │
  Collé/vissé
  
Laisse air circuler librement
```

#### **Hall SS49E:**
```
Double-face mousse 1mm
├─ Permet micro-ajustement distance
├─ Absorbe vibrations légères
└─ Collage/décollage facile

Ou support réglable:
  [SS49E]
     │
  ═══╪═══ Rail coulissant
     │
  Réglage précis distance 0.5-5 cm
```

---

## ⚠️ **ERREURS FRÉQUENTES À ÉVITER**

### **Erreur #1: Capteurs dans Boîtier ESP32**
```
❌ MAUVAIS:
┌──────────────┐
│ ESP32        │
│ DHT11 ←─┐   │ Auto-chauffe +5°C!
│ MPU6050  │   │ Pas de ventilation
│ Hall     │   │ Vibrations du boîtier
└──────────┴───┘

✅ BON:
┌──────────────┐
│ ESP32        │ Boîtier séparé
└──────────────┘
       │
    Câbles 20-50 cm
       │
    ┌──▼───────┐
    │ Capteurs │ Sur machine
    └──────────┘
```

### **Erreur #2: Ultrason mal aligné**
```
❌ Angle 30° → Mesure fausse
    [HC-SR04]
       │╲
       │ ╲30°
       ▼  ╲
    ═════════

✅ Perpendiculaire 90°
    [HC-SR04]
       │
       │ 90°
       ▼
    ═════════
```

### **Erreur #3: Hall trop loin**
```
❌ Distance 15cm → Signal faible
    [HALL]
       │
       │ 15cm
       ▼
    ≋≋≋≋≋≋

✅ Distance 2cm → Signal fort
    [HALL]
      │ 2cm
      ▼
    ≋≋≋≋≋≋
```

---

## 📏 **CHECKLIST INSTALLATION**
```
□ Vibration:
  □ Sur métal rigide
  □ Près roulement/moteur
  □ Fixation solide (VHB ou vis)
  □ Surface propre
  
□ MPU6050:
  □ Orientation X,Y,Z correcte
  □ Collage rigide (super-glue)
  □ Axes notés sur étiquette
  □ Test rotation OK
  
□ Ultrason:
  □ Angle 90° ± 5°
  □ Distance 10-50 cm
  □ Surface cible plane
  □ Aucun obstacle devant
  
□ DHT11:
  □ Air libre (pas boîtier)
  □ 10-15 cm de source chaleur
  □ Grille vers le bas
  □ Pas soleil direct
  
□ Hall SS49E:
  □ Face capteur vers bobine
  □ Distance 1-3 cm
  □ Fixation stable
  □ Calibration offset faite

□ Câblage:
  □ Câbles sécurisés (colliers)
  □ Pas près pièces mobiles
  □ Longueur suffisante (pas tendu)
  □ Protection huile/eau si besoin
  
□ Tests:
  □ Chaque capteur lu individuellement
  □ Valeurs cohérentes
  □ Stabilité sur 5 minutes
  □ Pas d'interférences
```

---

## 🎬 **POUR LA DÉMO CONCOURS**

### **Configuration Transportable:**
```
Support démonstration:
┌────────────────────────────────┐
│  Planche bois 40×30 cm         │
│                                │
│  [Ventilateur]  [ESP32+écran]  │
│       │              │         │
│    Capteurs ────── Câbles      │
│    fixés           courts      │
│                                │
│  [Batterie USB]  [Laptop]      │
│   Autonome      Dashboard      │
└────────────────────────────────┘

Transportable + Reproductible facilement
```

# Toutes les 10 secondes:
features_actuelles = lire_capteurs()

score_anomalie = 0
for arbre in foret:
    profondeur = parcourir_arbre(arbre, features_actuelles)
    score_anomalie += 1.0 / profondeur

score_anomalie /= 50  # Moyenne sur 50 arbres

if score_anomalie > seuil:
    ALERTE_ANOMALIE()
    diagnostiquer_cause()


---

### **Exemple Calcul Réel**

#### **Machine Saine:**
```
Features actuelles:
├─ Vibration: 450 (normal: 440 ± 30)
├─ Température: 48°C (normal: 47 ± 3°C)
├─ Distance US: 85mm (normal: 84 ± 4mm)
└─ ... 29 autres features similaires

Parcours dans les arbres:
Arbre 1: profondeur 4
Arbre 2: profondeur 3  
Arbre 3: profondeur 5
...
Arbre 50: profondeur 4

Profondeur moyenne: 4.2

Score = 1 / 4.2 = 0.238

Seuil appris: 0.520

0.238 < 0.520 → 🟢 NORMAL
```

#### **Machine en Panne Imminente:**
```
Features actuelles:
├─ Vibration: 850 ⚠️ (normal: 440 ± 30)
├─ Température: 62°C ⚠️ (normal: 47 ± 3°C)
├─ Distance US: 73mm ⚠️ (normal: 84 ± 4mm)
└─ ... plusieurs autres anormales

Parcours dans les arbres:
Arbre 1: profondeur 1 (isolée vite!)
Arbre 2: profondeur 1
Arbre 3: profondeur 2
...
Arbre 50: profondeur 1

Profondeur moyenne: 1.3

Score = 1 / 1.3 = 0.769

Seuil: 0.520

0.769 > 0.520 → 🔴 ANOMALIE CRITIQUE!
```

---

<a name="architecture"></a>
## 🏗️ **5. ARCHITECTURE DU SYSTÈME**

### **Schéma Global**
```
┌─────────────────────────────────────────────────────────┐
│                    MACHINE INDUSTRIELLE                 │
│         (Moteur, Pompe, Convoyeur, Compresseur...)      │
└────────────────┬────────────────────────────────────────┘
                 │
         ┌───────┴───────┐
         │  5 CAPTEURS   │
         ├───────────────┤
         │ • Vibration   │
         │ • MPU6050     │
         │ • Ultrason    │
         │ • DHT11       │
         │ • Hall EM     │
         └───────┬───────┘
                 │ Signaux analogiques/I2C
                 ▼
         ┌───────────────┐
         │   ESP32-CAM   │ ← Pas de caméra, juste ESP32
         │   WROVER      │    (ou ESP32 standard)
         ├───────────────┤
         │ • Collecte    │
         │ • Features    │
         │ • IA Model    │
         │ • Diagnostic  │
         └───────┬───────┘
                 │
        ┌────────┼────────┐
        │        │        │
        ▼        ▼        ▼
    ┌──────┐ ┌──────┐ ┌──────────┐
    │7-SEG │ │ 8×8  │ │  WiFi    │
    │Status│ │Matrix│ │Dashboard │
    └──────┘ └──────┘ └──────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ SMARTPHONE    │
                   │ ou ORDINATEUR │
                   ├───────────────┤
                   │ • Graphiques  │
                   │ • Historique  │
                   │ • Alertes SMS │
                   │ • Export PDF  │
                   └───────────────┘
```

---

### **Architecture Logicielle**
```
┌─────────────────────────────────────────┐
│         COUCHE PHYSIQUE (Hardware)      │
├─────────────────────────────────────────┤
│ Capteurs → ESP32 GPIO/I2C/ADC           │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      COUCHE ACQUISITION (Firmware)      │
├─────────────────────────────────────────┤
│ • Lecture capteurs (100 Hz)             │
│ • Filtrage signaux (low-pass, kalman)   │
│ • Buffer circulaire (3600 samples/h)    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    COUCHE TRAITEMENT (Feature Engine)   │
├─────────────────────────────────────────┤
│ • Extraction 32 features                │
│ • FFT vibrations                        │
│ • Statistiques (RMS, variance, etc.)    │
│ • Normalisation                         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       COUCHE IA (Isolation Forest)      │
├─────────────────────────────────────────┤
│ • Mode Learning (1-7 jours)             │
│ • Mode Inference (temps réel)           │
│ • Score anomalie (0-1)                  │
│ • Diagnostic cause (règles expertes)    │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│     COUCHE DÉCISION (Alert Manager)     │
├─────────────────────────────────────────┤
│ • État machine (Normal/Warning/Critical)│
│ • Seuils adaptatifs                     │
│ • Hystérésis (éviter faux positifs)     │
│ • Notifications                         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│    COUCHE INTERFACE (User Interface)    │
├─────────────────────────────────────────┤
│ • Afficheurs locaux (7-seg, 8×8)        │
│ • Dashboard web (HTML/CSS/JS)           │
│ • API REST (JSON)                       │
│ • Data logging (SPIFFS/SD)              │
└─────────────────────────────────────────┘
```

---

<a name="usages"></a>
## 💼 **6. CAS D'USAGE CONCRETS**

### **CAS 1: Usine Textile - Machine à Coudre Industrielle**

#### **Configuration:**
```
Machine: JUKI DDL-8700
Problème fréquent: Roulement navette usé
Coût panne: 3 jours arrêt = 4500€
```

#### **Installation PredictaMaint:**
```
Capteurs positionnés:
├─ Vibration: Sur carter moteur
├─ MPU6050: Sur tête de couture
├─ Ultrason: Vers courroie (tension)
├─ DHT11: Près moteur
└─ Hall EM: Bobine moteur

Apprentissage: 3 jours (machine neuve après maintenance)
```

#### **Résultat Après 2 Mois:**
```
Jour 45: Alerte "Roulement début usure"
├─ Vibration: +22% sur hautes fréquences
├─ Température: +1.8°C
└─ Prédiction: Panne dans 18-25 jours

Action: Commande roulement (35€)

Jour 52: Maintenance programmée samedi
├─ Durée: 2h
├─ Coût total: 180€
└─ ZÉRO interruption production

Économie: 4320€ (vs panne imprévue)
ROI: 2400% en 1 incident!
```

---

### **CAS 2: Exploitation Agricole - Pompe Irrigation**

#### **Configuration:**
```
Pompe: Centrifuge 5.5kW
Problème: Cavitation + usure roue
Coût panne: Récolte compromise = 8000€
```

#### **Installation:**
```
Capteurs:
├─ Vibration: Corps pompe
├─ MPU6050: Conduite sortie
├─ Ultrason: Niveau réservoir
├─ DHT11: Température eau
└─ Hall EM: Moteur électrique

Mode: Alimentation solaire + batterie
Connexion: GSM (zone sans WiFi)
```

#### **Résultat Saison 1:**
```
Incident 1 (Jour 34):
└─ Détection cavitation précoce
   Action: Ajustement vanne aspiration
   Économie: Panne évitée

Incident 2 (Jour 78):
└─ Usure roue détectée 21 jours avant
   Action: Remplacement programmé
   Coût: 450€ vs 8000€ récolte perdue
   
Bilan: 7550€ économisés
Coût système: 80€ (capteurs + ESP32)
ROI: 9400% première saison!
```

---

### **CAS 3: Atelier Mécanique - Compresseur d'Air**

#### **Configuration:**
```
Compresseur: 50L, 3HP
Usage: 8h/jour, 5j/semaine
Problème: Surchauffe + fuite soupape
```

#### **Résultat 6 Mois:**
```
3 Pannes Évitées:
├─ Soupape grippée (Jour 45)
│   └─ Économie: 800€
├─ Courroie usée (Jour 112)
│   └─ Économie: 350€
└─ Moteur surchauffe (Jour 156)
    └─ Économie: 1200€

Total économisé: 2350€
Investissement: 75€
ROI: 3100%

Bonus: Productivité +12% (moins d'arrêts)
```

---

### **CAS 4: Data Center - Ventilation Serveurs**

#### **Configuration:**
```
24 Ventilateurs industriels
Criticité: ULTRA-HAUTE (serveurs 24/7)
Coût panne 1 ventilo: Serveurs surchauffe = 50k€
```

#### **Solution:**
```
1 PredictaMaint par groupe de 3 ventilos
= 8 systèmes ESP32

Dashboard centralisé:
└─ Carte chaleur en temps réel
   Alertes prioritaires
   Prédiction charge maintenance

Résultat Année 1:
├─ 11 pannes prédites et évitées
├─ Économie estimée: 550k€
├─ Coût 8 systèmes: 600€
└─ ROI: 91600% 🤯