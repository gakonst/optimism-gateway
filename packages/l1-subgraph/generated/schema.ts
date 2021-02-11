// THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.

import {
  TypedMap,
  Entity,
  Value,
  ValueKind,
  store,
  Address,
  Bytes,
  BigInt,
  BigDecimal
} from "@graphprotocol/graph-ts";

export class ReceivedWithdrawal extends Entity {
  constructor(id: string) {
    super();
    this.set("id", Value.fromString(id));
  }

  save(): void {
    let id = this.get("id");
    assert(id !== null, "Cannot save ReceivedWithdrawal entity without an ID");
    assert(
      id.kind == ValueKind.STRING,
      "Cannot save ReceivedWithdrawal entity with non-string ID. " +
        'Considering using .toHex() to convert the "id" to a string.'
    );
    store.set("ReceivedWithdrawal", id.toString(), this);
  }

  static load(id: string): ReceivedWithdrawal | null {
    return store.get("ReceivedWithdrawal", id) as ReceivedWithdrawal | null;
  }

  get id(): string {
    let value = this.get("id");
    return value.toString();
  }

  set id(value: string) {
    this.set("id", Value.fromString(value));
  }

  get hash(): string {
    let value = this.get("hash");
    return value.toString();
  }

  set hash(value: string) {
    this.set("hash", Value.fromString(value));
  }

  get timestamp(): i32 {
    let value = this.get("timestamp");
    return value.toI32();
  }

  set timestamp(value: i32) {
    this.set("timestamp", Value.fromI32(value));
  }

  get msgHash(): string {
    let value = this.get("msgHash");
    return value.toString();
  }

  set msgHash(value: string) {
    this.set("msgHash", Value.fromString(value));
  }
}
