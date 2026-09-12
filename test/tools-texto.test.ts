import {
  contarTexto, convertirTexto, eliminarDuplicados,
  extraerEmails, extraerFechas, compararTextos,
} from "../shared/tools/texto";

let fallos = 0;
function chequear(nombre: string, actual: any, esperado: any) {
  const a = JSON.stringify(actual), e = JSON.stringify(esperado);
  if (a !== e) { console.log(`FALLA  ${nombre}\n   esperado: ${e}\n   obtenido: ${a}`); fallos++; }
  else console.log(`ok     ${nombre} => ${a}`);
}

const c = contarTexto("Hola mundo. Esto es una prueba.\n\nSegundo párrafo acá.");
chequear("palabras", c.palabras, 9);
chequear("oraciones", c.oraciones, 3);
chequear("párrafos", c.parrafos, 2);
chequear("texto vacío", contarTexto("").palabras, 0);

chequear("mayúsculas", convertirTexto("contrato de locación", "mayusculas"), "CONTRATO DE LOCACIÓN");
chequear("minúsculas", convertirTexto("CONTRATO DE LOCACIÓN", "minusculas"), "contrato de locación");
chequear("título", convertirTexto("contrato de arrendamiento rural", "titulo"), "Contrato de Arrendamiento Rural");
chequear("título respeta conectores", convertirTexto("el juez y la parte", "titulo"), "El Juez y la Parte");
chequear("oración", convertirTexto("hola. como va? bien!", "oracion"), "Hola. Como va? Bien!");

const dup = eliminarDuplicados("uno\ndos\nUNO\n  dos  \ntres",
  { ignorarMayusculas: true, ignorarEspacios: true, ordenar: false });
chequear("duplicados", dup.resultado, "uno\ndos\ntres");
chequear("eliminadas", dup.eliminadas, 2);

const dupSensible = eliminarDuplicados("uno\nUNO",
  { ignorarMayusculas: false, ignorarEspacios: false, ordenar: false });
chequear("case sensitive", dupSensible.unicas, 2);

chequear("emails", extraerEmails("Escribir a juan.perez@estudio.com.ar o a MARIA@test.com, gracias"),
  ["juan.perez@estudio.com.ar", "maria@test.com"]);
chequear("sin emails", extraerEmails("no hay nada"), []);

const fechas = extraerFechas("La audiencia del 12/09/2026 se pasó al 3 de octubre de 2026, según acta 2026-11-20.");
chequear("fechas ISO", fechas.map(f => f.iso), ["2026-09-12", "2026-10-03", "2026-11-20"]);

const f2 = extraerFechas("Vencimiento 05-03-26");
chequear("año de dos dígitos", f2[0].iso, "2026-03-05");

const diff = compararTextos("uno\ndos\ntres", "uno\ndos bis\ntres");
chequear("diff agregadas", diff.agregadas, 1);
chequear("diff quitadas", diff.quitadas, 1);
chequear("diff iguales", diff.iguales, 2);
chequear("diff sin cambios", compararTextos("a\nb", "a\nb").agregadas, 0);

console.log(fallos === 0 ? "\nTODO OK" : `\n${fallos} FALLA(S)`);
