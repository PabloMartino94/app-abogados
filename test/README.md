# Pruebas de la lógica de las herramientas

Los cálculos de `shared/tools/` no dependen de ninguna librería externa, así que
se pueden correr sin instalar nada más que `tsx`:

```
npx tsx test/tools-fechas.test.ts
npx tsx test/tools-montos.test.ts
npx tsx test/tools-texto.test.ts
```

Cada archivo imprime una línea por caso y termina con `TODO OK` si pasaron todos.
Conviene correrlas después de tocar cualquier fórmula o el cómputo de días hábiles.
