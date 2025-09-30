// src/components/spring-generator/useSpringBootGenerator.ts
"use client";

import JSZip from "jszip";
import { useStorage } from "@liveblocks/react";
import { LayerType } from "~/types";
import type { EntityLayer, RelationLayer } from "~/types";

/** Mapea tipos simples -> Java */
const toJavaType = (t: string) => {
  switch ((t || "").toLowerCase()) {
    case "int":
      return "Integer";
    case "long":
      return "Long";
    case "double":
      return "Double";
    case "boolean":
      return "Boolean";
    case "date":
      return "LocalDate";
    case "string":
    default:
      return "String";
  }
};

type Attr = { id: string; name: string; type: string; required?: boolean; pk?: boolean };

type PlainEntity = EntityLayer & { idInCanvas: string };
type PlainRelation = RelationLayer & { idInCanvas: string };

export function useSpringBootGenerator(projectName: string) {
  const layerIds = useStorage((root) => root.layerIds) || [];
  const layersMap = useStorage((root) => root.layers);

  const readRaw = (id: string): any | null => {
    const live: any = layersMap?.get(id);
    if (!live) return null;
    return typeof live.toImmutable === "function" ? live.toImmutable() : live;
  };

  const getEntitiesAndRelations = () => {
    const entities: PlainEntity[] = [];
    const relations: PlainRelation[] = [];

    for (const id of layerIds) {
      const raw = readRaw(id);
      if (!raw) continue;

      if (raw.type === LayerType.Entity) {
        entities.push({ ...(raw as EntityLayer), idInCanvas: id });
      } else if (raw.type === LayerType.Relation) {
        relations.push({ ...(raw as RelationLayer), idInCanvas: id });
      }
    }
    return { entities, relations };
  };

  const generateSpringBootZip = async () => {
    const { entities, relations } = getEntitiesAndRelations();

    if (!entities.length) {
      alert("No hay entidades en el lienzo.");
      return;
    }

    const zip = new JSZip();

    // ── estructura base del proyecto
    const basePkg = "com.example.demo";
    const pkgPath = basePkg.replace(/\./g, "/");
    const root = `spring-${projectName.replace(/\s+/g, "-").toLowerCase()}`;

    // pom.xml
    zip.file(
      `${root}/pom.xml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" 
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
  xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <groupId>${basePkg}</groupId>
  <artifactId>${projectName.replace(/\s+/g, "-").toLowerCase()}</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>${projectName}</name>
  <description>Generado desde el lienzo</description>
  <properties>
    <java.version>17</java.version>
    <spring-boot.version>3.3.4</spring-boot.version>
  </properties>
  <dependencyManagement>
    <dependencies>
      <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-dependencies</artifactId>
        <version>\${spring-boot.version}</version>
        <type>pom</type>
        <scope>import</scope>
      </dependency>
    </dependencies>
  </dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-compiler-plugin</artifactId>
        <configuration>
            <parameters>true</parameters>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>`
    );

    // application.properties
    zip.file(
      `${root}/src/main/resources/application.properties`,
      `spring.datasource.url=jdbc:h2:mem:testdb
spring.h2.console.enabled=true
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true`
    );

    // Application
    zip.file(
      `${root}/src/main/java/${pkgPath}/DemoApplication.java`,
      `package ${basePkg};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class DemoApplication {
  public static void main(String[] args) {
    SpringApplication.run(DemoApplication.class, args);
  }
}`
    );

    // ── directorios por capa
    const modelDir = `${root}/src/main/java/${pkgPath}/model`;
    const repoDir = `${root}/src/main/java/${pkgPath}/repository`;
    const svcDir = `${root}/src/main/java/${pkgPath}/service`;
    const ctrlDir = `${root}/src/main/java/${pkgPath}/controller`;

    const byId = new Map(entities.map((e) => [e.idInCanvas, e]));

    // Mapa relaciones por entidad
    const relsByEntity: Record<
      string,
      Array<{
        other: PlainEntity;
        srcMany: boolean;
        dstMany: boolean;
        owningSide: "source" | "target";
        isSource: boolean;
      }>
    > = {};

    for (const rel of relations) {
      const src = byId.get(rel.sourceId);
      const dst = byId.get(rel.targetId);
      if (!src || !dst) continue;

      const srcMany = rel.sourceCard === "MANY";
      const dstMany = rel.targetCard === "MANY";
      const owning: "source" | "target" =
        rel.owningSide === "source" ? "source" : "target";

      (relsByEntity[src.idInCanvas] ||= []).push({
        other: dst,
        srcMany,
        dstMany,
        owningSide: owning,
        isSource: true,
      });
      (relsByEntity[dst.idInCanvas] ||= []).push({
        other: src,
        srcMany,
        dstMany,
        owningSide: owning,
        isSource: false,
      });
    }

    for (const ent of entities) {
      const className = ent.name.replace(/[^A-Za-z0-9]/g, "") || "Entity";
      const varName = className.charAt(0).toLowerCase() + className.slice(1);

      const attrs = (ent.attributes || []) as Attr[];
      const idAttr = attrs.find((a) => a.pk);
      const idName = (idAttr?.name ?? "id").replace(/[^A-Za-z0-9_]/g, "") || "id";
      const idTypeJava = toJavaType(idAttr?.type ?? "Long");

      // ===== MODEL =====
      let fields = `  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private ${idTypeJava} ${idName};\n`;

      // Atributos simples
      for (const a of attrs) {
        if (a.pk) continue;
        const j = toJavaType(a.type ?? "String");
        const n = (a.name || "field").replace(/[^A-Za-z0-9_]/g, "");
        fields += `  private ${j} ${n};\n`;
      }

      // Relaciones y acceso extra
      const rels = relsByEntity[ent.idInCanvas] || [];
      const relationAccessors: string[] = [];
      const manyToOneFinders: Array<{
        fieldName: string;
        targetIdType: string;
      }> = [];

      for (const r of rels) {
        const otherName = r.other.name.replace(/[^A-Za-z0-9]/g, "") || "Other";
        const otherVar = otherName.charAt(0).toLowerCase() + otherName.slice(1);

        // MANY -> ONE  (este lado tiene @ManyToOne)
        const thisHasManyToOne =
          (r.isSource && r.srcMany && !r.dstMany) ||
          (!r.isSource && r.dstMany && !r.srcMany);

        // ONE -> MANY  (este lado tiene @OneToMany)
        const thisHasOneToMany =
          (r.isSource && !r.srcMany && r.dstMany) ||
          (!r.isSource && !r.dstMany && r.srcMany);

        // nombres de referencia JSON estables: "one-many"
        const oneVar = thisHasOneToMany ? varName : otherVar;
        const manyVar = thisHasOneToMany ? otherVar : varName;
        const pairName = `${oneVar}-${manyVar}`;

        if (thisHasManyToOne) {
          // JoinColumn se basa en el lado "one" (otherVar aquí)
          fields += `
  @com.fasterxml.jackson.annotation.JsonBackReference("${pairName}")
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "${otherVar}_id")
  private ${otherName} ${otherVar};\n`;

          relationAccessors.push(
            `  public ${otherName} get${capitalize(otherVar)}(){ return this.${otherVar}; }
  public void set${capitalize(otherVar)}(${otherName} ${otherVar}){ this.${otherVar} = ${otherVar}; }`,
          );

          // Para generar repo/service/controller de filtrado por padre
          const otherIdAttr = (r.other.attributes as Attr[] | undefined)?.find((a) => a.pk);
          const otherIdType = toJavaType(otherIdAttr?.type ?? "Long");
          manyToOneFinders.push({ fieldName: otherVar, targetIdType: otherIdType });
        }

        if (thisHasOneToMany) {
          // mappedBy = nombre del campo en el lado MANY que apunta a "este" (varName)
          fields += `
  @com.fasterxml.jackson.annotation.JsonManagedReference("${pairName}")
  @OneToMany(mappedBy = "${varName}", cascade = CascadeType.ALL, orphanRemoval = true)
  private java.util.List<${otherName}> ${otherVar}s = new java.util.ArrayList<>();\n`;

          relationAccessors.push(
            `  public java.util.List<${otherName}> get${capitalize(otherVar)}s(){ return this.${otherVar}s; }
  public void set${capitalize(otherVar)}s(java.util.List<${otherName}> ${otherVar}s){ this.${otherVar}s = ${otherVar}s; }`,
          );
        }
      }

      const baseAccessors = [
        { name: idName, type: idTypeJava },
        ...attrs
          .filter((a) => !a.pk)
          .map((a) => ({
            name: (a.name || "field").replace(/[^A-Za-z0-9_]/g, ""),
            type: toJavaType(a.type || "String"),
          })),
      ]
        .map(({ name, type }) => {
          const N = capitalize(name);
          return `  public ${type} get${N}(){ return this.${name}; }
  public void set${N}(${type} ${name}){ this.${name} = ${name}; }`;
        })
        .join("\n");

      const model = `package ${basePkg}.model;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;

@Entity
public class ${className} {

${fields}
  // getters & setters
${baseAccessors}
${relationAccessors.length ? "\n" + relationAccessors.join("\n") : ""}
}
`;
      zip.file(`${modelDir}/${className}.java`, model);

      // ===== REPOSITORY =====
      // Extendemos con findBy<ManyToOneField>Id si corresponde
      let extraRepoMethods = "";
      for (const f of manyToOneFinders) {
        extraRepoMethods += `\n  java.util.List<${className}> findBy${capitalize(f.fieldName)}Id(${f.targetIdType} id);`;
      }

      const repo = `package ${basePkg}.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import ${basePkg}.model.${className};

public interface ${className}Repository extends JpaRepository<${className}, ${idTypeJava}> {${extraRepoMethods}
}
`;
      zip.file(`${repoDir}/${className}Repository.java`, repo);

      // ===== SERVICE =====
      let extraService = "";
      for (const f of manyToOneFinders) {
        extraService += `
  public java.util.List<${className}> findBy${capitalize(f.fieldName)}(${f.targetIdType} ${f.fieldName}Id){
    return repo.findBy${capitalize(f.fieldName)}Id(${f.fieldName}Id);
  }`;
      }

      const service = `package ${basePkg}.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ${basePkg}.model.${className};
import ${basePkg}.repository.${className}Repository;

@Service
@Transactional
public class ${className}Service {
  private final ${className}Repository repo;

  public ${className}Service(${className}Repository repo) {
    this.repo = repo;
  }

  public List<${className}> findAll(){ return repo.findAll(); }
  public ${className} findById(${idTypeJava} id){ return repo.findById(id).orElse(null); }
  public ${className} save(${className} e){ return repo.save(e); }
  public void delete(${idTypeJava} id){ repo.deleteById(id); }${extraService}
}
`;
      zip.file(`${svcDir}/${className}Service.java`, service);

      // ===== CONTROLLER =====
      const setterId = "set" + capitalize(idName);

      let extraEndpoints = "";
      for (const f of manyToOneFinders) {
        // /api/<entity>/<field>/{id}
        extraEndpoints += `

  @GetMapping("/${f.fieldName}/{${f.fieldName}Id}")
  public java.util.List<${className}> by${capitalize(f.fieldName)}(@PathVariable ${f.targetIdType} ${f.fieldName}Id){
    return service.findBy${capitalize(f.fieldName)}(${f.fieldName}Id);
  }`;
      }

      const controller = `package ${basePkg}.controller;

import java.util.List;
import org.springframework.web.bind.annotation.*;
import ${basePkg}.model.${className};
import ${basePkg}.service.${className}Service;

@RestController
@RequestMapping("/api/${varName}")
@CrossOrigin
public class ${className}Controller {
  private final ${className}Service service;

  public ${className}Controller(${className}Service service) {
    this.service = service;
  }

  @GetMapping
  public List<${className}> all(){ return service.findAll(); }

  @GetMapping("/{id}")
  public ${className} byId(@PathVariable ${idTypeJava} id){ return service.findById(id); }${extraEndpoints}

  @PostMapping
  public ${className} create(@RequestBody ${className} body){ return service.save(body); }

  @PutMapping("/{id}")
  public ${className} update(@PathVariable ${idTypeJava} id, @RequestBody ${className} body){
    body.${setterId}(id);
    return service.save(body);
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable ${idTypeJava} id){ service.delete(id); }
}
`;
      zip.file(`${ctrlDir}/${className}Controller.java`, controller);
    }

    // Descargar ZIP
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "_")}_spring_boot.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return generateSpringBootZip;
}

/* ========== helpers locales ========== */
function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
