# NexoCash

Aplicacion web responsive para controlar ingresos, gastos, alertas y resumen mensual.

## Funciones

- Registro de ingresos con referencia, concepto y valor.
- Registro de gastos con referencia, concepto y valor.
- Calculo automatico de totales, balance y porcentaje de uso del ingreso.
- Alarma visual cuando los gastos se acercan o superan los ingresos.
- Grafico mensual en canvas.
- Datos guardados en el navegador con `localStorage`.

## Ejecutar localmente

```bash
npm start
```

Luego abre:

```text
http://localhost:3000
```

## Verificar sintaxis

```bash
npm run check
```

## Publicar en GitHub

```bash
git init
git add .
git commit -m "Create NexoCash financial app"
git branch -M main
git remote add origin <URL_DEL_REPOSITORIO>
git push -u origin main
```

## Publicar en Railway

1. Crea un nuevo proyecto en Railway.
2. Conecta el repositorio de GitHub.
3. Railway detectara Node.js y ejecutara `npm start`.
4. El servidor usa `process.env.PORT`, requerido por Railway.
