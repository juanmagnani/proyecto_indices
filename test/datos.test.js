import assert from "node:assert";
import { buildIndices } from "../api/datos.js";

const csv = `"ID","Fecha","Nombre índice","Acumulado / Valor hora","Valor mensual","Unidad de medida","",""
"1","1/12/2015","IPIM","100","","","",""
"2","1/01/2016","IPIM","108,7871791","0,08787179073","%","",""
"8029","18/11/2026","Precio USD billete BNA","","1580,","$","",""
"8028","17/11/2026","Precio USD billete BNA","","1.575,50","$","",""
"8222","30/09/2026","UOM","8260,02","0,04","%","",""
"","","","","","","",""
`;
const r = buildIndices(csv);
assert.deepStrictEqual(r.map((i) => i.nombre), ["IPIM", "Precio USD billete BNA", "UOM"]);
assert.deepStrictEqual(r[0].datos[1], ["2016-01-01", 108.7871791, 0.08787179073]);
assert.strictEqual(r[0].unidad, "%");
assert.deepStrictEqual(r[1].datos, [["2026-11-17", null, 1575.5], ["2026-11-18", null, 1580]]);
assert.strictEqual(r[2].datos[0][1], 8260.02);
console.log("ok");
