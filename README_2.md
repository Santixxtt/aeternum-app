# 📘 Personal Software Process (PSP) aplicado al proyecto **Aeternum**

## 👥 Integrantes  
- **Laura Mariana Ruiz**  
- **David Santiago Tuta**

---

# 🎯 Objetivo General del PSP  
Desarrollar competencias para planificar, ejecutar, medir y mejorar el proceso personal de construcción de software, aplicando los principios del PSP (Personal Software Process) en un entorno real de desarrollo.  
El PSP permite mejorar la calidad del software, aumentar la productividad, refinar las estimaciones y reducir defectos mediante un análisis disciplinado del trabajo personal.

---

# 1. Fundamentos y Principios del PSP  
## Actividad 1 — Diagnóstico personal de proceso  
**Objetivo:** Identificar las prácticas actuales que cada desarrollador aplica en su proceso.

## Diagrama del Proceso Personal (ASCII)

```txt
              ┌────────────────────────┐
              │ 1. Recepción del Req.  │
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │ 2. Análisis del Req.   │
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │ 3. Diseño Preliminar   │
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │ 4. División en Tareas  │
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │     5. Codificación    │
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │   6. Pruebas Unitarias │
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │     7. Integración     │
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │ 8. Validación Funcional│
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │    9. Documentación    │
              └─────────────┬──────────┘
                            ▼
              ┌────────────────────────┐
              │10. Postmortem (PSP)    │
              └────────────────────────┘
```

### 1.1 Descripción del proceso personal  
1. Recepción y revisión del requerimiento  
2. Análisis funcional y definición de criterios  
3. Diseño preliminar del módulo  
4. Descomposición en tareas pequeñas  
5. Codificación  
6. Pruebas unitarias  
7. Integración entre módulos  
8. Validación funcional  
9. Documentación  
10. Revisión postmortem  

### 1.2 Fortalezas y Debilidades  

**Fortalezas:**  
- Dominio de herramientas  
- Flujo de trabajo constante  
- Buena organización para dividir tareas  

**Debilidades:**  
- Documentación limitada  
- Pruebas realizadas muy tarde  
- Validaciones implementadas al final  
- Estimaciones iniciales inconsistentes  

---

# 2. Método PROBE (Proxy-Based Estimating)  
## Actividad 2 — Estimación del tamaño y esfuerzo  

El método PROBE permite estimar tamaño y esfuerzo comparando módulos nuevos con módulos desarrollados anteriormente en el proyecto.

### Aplicación del método:  
- Identificación de módulos similares en proyectos previos  
- Comparación de dificultad, tamaño y esfuerzo  
- Estimación de LOC (líneas de código) por módulo  
- Estimación del tiempo total usando datos históricos  

*Entregable grupal:* **Metodo_Probe.pdf**

                ┌───────────────────────────┐
                │   Selección de Proxy      │
                │ (módulos previos similares)│
                └──────────────┬────────────┘
                               ▼
                ┌───────────────────────────┐
                │ Comparación de complejidad│
                │   ligera / media / alta   │
                └──────────────┬────────────┘
                               ▼
                ┌───────────────────────────┐
                │ Estimación del tamaño     │
                │        (LOC)              │
                └──────────────┬────────────┘
                               ▼
                ┌───────────────────────────┐
                │ Estimación del esfuerzo   │
                │     (horas esperadas)     │
                └──────────────┬────────────┘
                               ▼
                ┌───────────────────────────┐
                │ Registro real y ajuste    │
                │       del modelo PSP      │
                └───────────────────────────┘

---

# 3. Estadísticas y Análisis de Resultados  
## Actividad 3 — Evaluación del desempeño personal  

### 3.1 Métricas del proyecto
| Métrica | Valor |
|--------|-------|
| Tamaño total del programa | **1750 LOC** |
| Tiempo total invertido | **213 horas** |
| Defectos encontrados | **5** |
| Defectos corregidos | **5** |
| Productividad | **8.21 LOC/h** |
| Densidad de defectos | **0.002857 defectos/LOC** |
| Diferencia en tiempo estimado | **–25% del estimado** |

        ┌──────────────────────────┐
        │   Código en desarrollo   │
        └───────────────┬──────────┘
                        ▼
        ┌──────────────────────────┐
        │   Detección de defecto   │
        └───────────────┬──────────┘
                        ▼
        ┌──────────────────────────┐
        │ Registro en GitHub Issue │
        └───────────────┬──────────┘
                        ▼
        ┌──────────────────────────┐
        │  Diagnóstico y análisis  │
        └───────────────┬──────────┘
                        ▼
        ┌──────────────────────────┐
        │     Corrección del bug   │
        └───────────────┬──────────┘
                        ▼
        ┌──────────────────────────┐
        │     Prueba de validación │
        └───────────────┬──────────┘
                        ▼
        ┌──────────────────────────┐
        │   Cierre del incidente   │
        └──────────────────────────┘


### 3.2 Análisis de desempeño  
- Los módulos de **autenticación** y **panel administrativo** fueron los que introdujeron más defectos.  
- La mayoría de errores se detectaron en la **fase de pruebas e integración**, principalmente errores de lógica.  
- Técnicas más útiles para prevenir defectos:  
  - Revisión manual del código  
  - Pruebas funcionales continuas  
  - Dividir módulos en partes pequeñas  
  - Validación temprana de endpoints  

*Entregable:* **Evaluacion_Desempeno_Personal_PSP.pdf**

---

# 4. Herramientas Informáticas de Apoyo  
## Actividad 4 — Implementación con herramientas digitales  

### Herramientas utilizadas
- **Clockify** para registro de tiempo  
- **GitHub Issues** para control de defectos  
- **Excel / Python** (pandas, matplotlib) para estadísticas  
- **GitHub** para control de versiones  

Se documentaron capturas del flujo digital utilizado.

---

# 5. Retroalimentación y Mejora Continua  
## Actividad 5 — Postmortem del proceso  

### 5.1 Lecciones aprendidas  
- Importancia de registrar horas reales diariamente  
- Validar estimaciones antes de iniciar cada módulo  
- No subestimar módulos complejos como autenticación  
- Integrar pruebas desde etapas tempranas

              ┌─────────────────────────┐
              │  Planificación (PSP0.1) │
              └──────────┬──────────────┘
                         ▼
      ┌──────────────────────────────────────┐
      │      Desarrollo y Registro (PSP1)    │
      │  - Tiempo                            │
      │  - Tamaño (LOC)                      │
      │  - Defectos                          │
      └────────────────┬─────────────────────┘
                       ▼
      ┌──────────────────────────────────────┐
      │     Mejora y Análisis (PSP2)         │
      │  - Productividad                     │
      │  - Densidad de defectos              │
      │  - Precisión de estimaciones         │
      └────────────────┬─────────────────────┘
                       ▼
              ┌─────────────────────────┐
              │   Postmortem (PSP3)     │
              │   + Plan de mejora      │
              └─────────────────────────┘


### 5.2 Plan de mejora personal (PPIP)

| Objetivo personal | Acción específica | Indicador | Fecha límite |
|------------------|-------------------|-----------|--------------|
| Reducir defectos en integración | Implementar pruebas unitarias antes de integrar | Defectos por módulo | Próximo proyecto |
| Mejorar precisión en estimaciones | Registrar horas reales diariamente | Diferencia entre estimado y real | Próxima iteración PSP |
| Optimizar autenticación | Reutilizar plantillas validadas | Tiempo de desarrollo por módulo | Próxima versión |
| Aumentar productividad | Revisiones tempranas antes de codificar | LOC/hora | Próximos ciclos |

📄 *Entregable:* **PPIP - Personal Process Improvement Plan.pdf**

---

# 6. Conclusión  
El PSP permitió identificar tiempos reales de desarrollo, fortalecer la toma de decisiones, mejorar estimaciones y disminuir defectos.  
Las métricas obtenidas evidencian oportunidades de mejora que permitirán ejecutar futuros proyectos con mayor eficiencia, precisión y calidad.

---

# 📎 Enlace al Repositorio  
*(Reemplazar por el enlace real)*  
➡️ **https://github.com/tu-repo/aeternum**

