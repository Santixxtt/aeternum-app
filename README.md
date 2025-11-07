# Aeternum

Queremos darte la bienvenida a **Aeternum**, esta es un proyecto en dúo donde buscábamos hacer una librería virtual para todo el mundo, que puedan encontrar, pedir, descargar y leer libros de una forma segura y en un solo lugar.

Nos enfocamos en tu seguridad, por eso este proyecto sigue en crecimiento para tu seguridad aún así usando tecnológias actuales.

## 📃 Manual de instalación 

Para poder iniciar a desplegar nuestro proyecto localmente primero necesitas las siguientes tecnologías.

- ### Python 
```bash
Python --version 
```
Asegúrate de instalarlo en su página oficial y no olvides instalar el **PATH** para que funcione correctamente la instalación de dependencias
```bash
https://www.python.org/downloads/
```
- ### NodeJS
```bash
node --v
```
Asegúrate de instarlo en la página oficial si no lo tienes aún instalado.
```bash
https://nodejs.org/es/download
```
- ### Git
```bash
git --v
```
Para el control de versiones necesitarás **GIT**. Si no lo tienes asegúrate de instalarlo en la página oficial.
```bash
https://git-scm.com/install
```
- ### Visual Studio Code 
Lo necesitaremos para poder ver, actualizar y desplegar la consola. Instalarlo en la página oficial.
```bash
https://code.visualstudio.com/download
```
## 🔩 Configuration de Entorno 
Una vez tengas todo instalado podemos iniciar a desplegar el proyecto localmente, para eso tendremos que instalar con una serie de comandos.

Abre una consola en **Visual** o en su defecto en **Git** y tendrás que clonar el repositorio 
```bash
git clone https://github.com/Santixxtt/aeternum-app.git
```
Después descargaras y extraeras la carpeta **ZIP** en tu computador y lo abrirás en visual.


Abrirás una terminal en **Visual** o también puedes en **Git**, solo asegúrate de estar en la URL del proyecto.

#### Ejemplo 
```bash
C:/User/Desktop/aeternum
```

Una vez hecho esto tendremos que instalar en visual o en tu editor de código los módulos de node.
```bash
npm install
```
Con esto verás que en el menú lateral izquierdo se habrá creado una carpeta llamada **node_modules** significa que ya quedó.

Ahora instalaremos lo necesario para la página, para eso tenemos ```requirements.txt```.  Lo instalarlas de la siguiente forma.
```bash
cd backend 
pip install -r requirements.txt
```
Con esto tendrás instalado todo lo necesario para el proyecto.

## 🔗 Base de Datos
Como te darás cuenta cuando abres nuestro archivo ```database.py``` los puertos y contraseñas están encriptados, lo mismo pasa con ```redis.py``` y ``` security.py```. Para que sirvan estas variables tienes que crear una base de datos o contactar con nosotros para tener acceso a esta. Nosotros usamos **Railway**, tú puedes usar el de tu preferencia.

Para conectarlo de forma correcta puedes usar las mismas variables o las de tu preferencia pero recuerda cambiarlas en el código; tendras que crear un archivo ```.env```.
```bash
cd backend 
.env #Es el que tienes que crear
```
Una vez hecho esto el proyecto estará conectado a la base de datos 🥳.
Aún así cuando se levanta abran una serie de **logs** que te dirán si quedo bien conectado.

## ✈️ Despliegue de Proyecto
Una vez ya tengamos todo instalado y configurado toca levantar el **Frontend** y el **Backend**, tendrás que abrir dos terminales en bash y poner los siguientes comandos, una en cada una:

### Frontend 
```bash
npm run dev
```
### Backend 
```bash
cd backend
uvicorn app.main:app --reload 
```

Con estos comandos ya se abra desplegado el proyecto localmente.

## ⚠️ Posibles Errores

Si cuando ejecutas el comando para desplegar el **Backend** aparece:
```bash
$ uvicorn: command not found 
```
Significa que se instaló de forma incorrecta o interrumpida **Python** o no has instalado ```requirements.txt```

### Formas de soluciónarlo

1. Para solucionarlo debes revisar que hayas instalado el **PATH** cuando hayas instalado **Python**.
2. Asegúrate que hayas instalado ```requirements.txt``` si es así y sigue apareciendo este error prueba instalar ```uvicorn``` directamente.
```bash
pip install uvicorn
```
3. Si ninguna de las anteriores funcióna puedes desplegarlo con Python así:
```bash
python -u uvicorn app.main:app --reload
```
**Nota:**
Revisa que no se esté usando el puerto en otro servicio, dependiendo del que uses.
## Recomendaciones
- Sigue en orden estos pasos para asegurar al 100% que el programa va a correr de forma correcta.
- No uses más de un servicio a la vez si trabajas en otros proyectos, puede causar error localmente.
- Si usas **VS Code** te recomendamos instalar extensiones como Python y Node pueden causar fallos si no están las extensiones.
##### Versión: 1.0
##### Manual de Usuario:[acorta_link](https://santixxtt.github.io/Documentacion-Aeternum/)