import { layers } from "./inventory.js";
import { powerOf } from "./tree.js";

export function skillRecord(skill, weapon, power) {
  let element = skill.element || "none";
  if (element === "weapon") element = (weapon && weapon.element) || "none";
  let reach = skill.range;
  if (reach === "weapon") reach = 1;
  if (reach === "self") reach = 0;
  if (typeof reach !== "number") reach = 1;
  let style = skill.sfx || "bronze";
  if (style === "weapon") {
    style = element === "seal" ? "seal" : element === "fracture" ? "fracture" : "bronze";
  }
  return {
    id: skill.id,
    name: skill.name,
    mp: skill.mp || 0,
    power: power != null ? power : (skill.powerOverride != null ? skill.powerOverride : (skill.power || 0)),
    reach,
    kind: skill.kind === "spell" ? "magical" : "physical",
    style,
    element,
    overlay: skill.overlay || "slash",
    target: skill.target || "foe"
  };
}

export function defaultAct(known) {
  if (!known || !known.length) return null;
  return known.find((row) => row.power > 0 && (row.target === "foe" || row.target === "foes")) || known[0];
}

export function applyCard(units, slot, books) {
  slot.party.forEach((member) => {
    const unit = units.find((row) => row.id === member.id);
    const body = books.units[member.id];
    if (!unit || !body) return;
    const calling = member.calling ? books.callings[member.calling] : null;
    const worn = layers(member, body, calling, books.items, books.tree && books.tree.byId).worn;
    unit.maxHp = worn.hp;
    unit.maxMp = worn.mp;
    unit.hp = member.hp == null ? worn.hp : Math.min(member.hp, worn.hp);
    unit.mp = member.mp == null ? worn.mp : Math.min(member.mp, worn.mp);
    unit.ATK = worn.atk;
    unit.DEF = worn.def;
    unit.MAG = worn.mag;
    unit.RES = worn.res;
    unit.spd = worn.spd;
    unit.HUM = worn.hum;
    unit.ACCORD = worn.accord;
    unit.EVA = worn.eva;
    unit.LUCK = worn.luck;
    unit.ACC = worn.acc;
    const weapon = member.equip && member.equip.weapon ? books.items[member.equip.weapon] : null;
    unit.known = (member.known || []).map((id) => books.skills[id]).filter(Boolean).map((skill) => {
      return skillRecord(skill, weapon, powerOf(member, books.tree, skill.id, skill.power || 0));
    });
    unit.family = weapon ? weapon.family : null;
  });
}
