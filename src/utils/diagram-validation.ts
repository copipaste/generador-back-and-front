import type { DiagramContext, DiagramOperation } from "~/types/diagram";

/**
 * Valida que una operación sea válida antes de ejecutarla
 */
export function validateOperation(
  operation: DiagramOperation,
  context: DiagramContext
): { valid: boolean; error?: string } {
  switch (operation.type) {
    case "ADD_ENTITY":
      // Verificar que no exista ya una entidad con ese nombre
      if (context.entities.some((e) => e.name.toLowerCase() === operation.name.toLowerCase())) {
        return { valid: false, error: `La entidad "${operation.name}" ya existe` };
      }
      return { valid: true };

    case "REMOVE_ENTITY":
      // Verificar que la entidad exista
      if (!context.entities.some((e) => e.name.toLowerCase() === operation.entityName.toLowerCase())) {
        return { valid: false, error: `La entidad "${operation.entityName}" no existe` };
      }
      return { valid: true };

    case "ADD_ATTRIBUTE":
      // Verificar que la entidad exista
      const entityForAdd = context.entities.find(
        (e) => e.name.toLowerCase() === operation.entityName.toLowerCase()
      );
      if (!entityForAdd) {
        return { valid: false, error: `La entidad "${operation.entityName}" no existe` };
      }
      // Verificar que no exista ya un atributo con ese nombre
      if (entityForAdd.attributes.some((a) => a.name.toLowerCase() === operation.attribute.name.toLowerCase())) {
        return { valid: false, error: `El atributo "${operation.attribute.name}" ya existe en "${operation.entityName}"` };
      }
      return { valid: true };

    case "REMOVE_ATTRIBUTE":
      // Verificar que la entidad exista
      const entityForRemove = context.entities.find(
        (e) => e.name.toLowerCase() === operation.entityName.toLowerCase()
      );
      if (!entityForRemove) {
        return { valid: false, error: `La entidad "${operation.entityName}" no existe` };
      }
      // Verificar que el atributo exista
      if (!entityForRemove.attributes.some((a) => a.name.toLowerCase() === operation.attributeName.toLowerCase())) {
        return { valid: false, error: `El atributo "${operation.attributeName}" no existe en "${operation.entityName}"` };
      }
      return { valid: true };

    case "MODIFY_ATTRIBUTE":
      // Verificar que la entidad exista
      const entityForModify = context.entities.find(
        (e) => e.name.toLowerCase() === operation.entityName.toLowerCase()
      );
      if (!entityForModify) {
        return { valid: false, error: `La entidad "${operation.entityName}" no existe` };
      }
      // Verificar que el atributo exista
      if (!entityForModify.attributes.some((a) => a.name.toLowerCase() === operation.attributeName.toLowerCase())) {
        return { valid: false, error: `El atributo "${operation.attributeName}" no existe en "${operation.entityName}"` };
      }
      return { valid: true };

    case "ADD_RELATION":
      // Verificar que ambas entidades existan
      if (!context.entities.some((e) => e.name.toLowerCase() === operation.sourceEntity.toLowerCase())) {
        return { valid: false, error: `La entidad origen "${operation.sourceEntity}" no existe` };
      }
      if (!context.entities.some((e) => e.name.toLowerCase() === operation.targetEntity.toLowerCase())) {
        return { valid: false, error: `La entidad destino "${operation.targetEntity}" no existe` };
      }
      return { valid: true };

    case "REMOVE_RELATION":
      // Verificar que la relación exista
      const relationExists = context.relations.some(
        (r) =>
          r.source.toLowerCase() === operation.sourceEntity.toLowerCase() &&
          r.target.toLowerCase() === operation.targetEntity.toLowerCase()
      );
      if (!relationExists) {
        return { valid: false, error: `No existe una relación entre "${operation.sourceEntity}" y "${operation.targetEntity}"` };
      }
      return { valid: true };

    case "MODIFY_ENTITY":
      // Verificar que la entidad exista
      if (!context.entities.some((e) => e.name.toLowerCase() === operation.entityName.toLowerCase())) {
        return { valid: false, error: `La entidad "${operation.entityName}" no existe` };
      }
      // Si hay un nuevo nombre, verificar que no exista ya
      if (operation.newName) {
        if (context.entities.some((e) => e.name.toLowerCase() === operation.newName!.toLowerCase())) {
          return { valid: false, error: `Ya existe una entidad con el nombre "${operation.newName}"` };
        }
      }
      return { valid: true };

    default:
      return { valid: false, error: "Tipo de operación desconocido" };
  }
}
