# proyecto_indices

Página que muestra índices (IPC, IPIM, UOM) y cotizaciones (dólar, euro) leídos de un Google Sheets, y calcula la variación acumulada entre dos fechas.

## Cómo funciona

- `index.html`: la página. Para cada índice se elige una **fecha desde** y una **fecha hasta**. Se muestra el valor en cada fecha y el % acumulado entre ambas.
- `api/datos.js`: función serverless de Vercel que descarga la planilla como CSV y la devuelve en JSON. Las respuestas se guardan en caché 10 minutos.

## Reglas de cálculo

- **Valor en una fecha**: el último dato disponible en esa fecha o antes. Así, un fin de semana toma la cotización del viernes, y una fecha a mitad de mes toma el índice de ese mes.
- **Valor**: se toma la columna "Acumulado / Valor hora". En las cotizaciones (unidad `$`) el precio está en la columna "Valor mensual".
- **% acumulado**: `valor hasta / valor desde − 1`. Si un índice en `%` no tiene valor acumulado (por ejemplo UOM antes de 2026), se componen las variaciones mensuales posteriores a la fecha desde y hasta la fecha hasta inclusive.

## Planilla

Hoja `indices` con las columnas: ID, Fecha (d/m/aaaa), Nombre índice, Acumulado / Valor hora, Valor mensual y Unidad de medida. Cualquier persona con el enlace tiene que poder verla.

Para usar otra planilla, configurá en Vercel las variables de entorno `SHEET_ID` y, si hace falta, `SHEET_NAME`.

## Pruebas

```
npm test
```
