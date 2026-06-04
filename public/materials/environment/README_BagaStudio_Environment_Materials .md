# BagaStudio Environment Material Library

Questa cartella è dedicata ai materiali PBR per la stanza/ambiente, separati dalle texture dei mobili.

Struttura prevista per ogni materiale:

```txt
albedo.jpg
normal.jpg
roughness.jpg
ao.jpg
```

Materiali iniziali collegati nel codice:

```txt
public/materials/environment/floors/oak-premium/
public/materials/environment/floors/walnut-premium/
public/materials/environment/floors/concrete-soft/
public/materials/environment/walls/showroom-warm/
public/materials/environment/walls/luxury-beige/
public/materials/environment/walls/microcement-light/
```

Fonti consigliate: Poly Haven e ambientCG, usando texture PBR CC0 adatte a pavimenti/pareti. Scaricare i set PBR e rinominare le mappe come sopra.

Il Viewer ha fallback procedurale: se le immagini non sono presenti, il programma non si rompe.
