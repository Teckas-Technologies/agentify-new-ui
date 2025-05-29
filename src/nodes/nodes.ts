import { Node } from "./node.types";
import httpRequestNode from './httpRequestNode.json';
import scheduleTriggerNode from './scheduleTriggerNode.json';

export const nodes: Node[] = [
    httpRequestNode as unknown as Node,
    scheduleTriggerNode as unknown as Node
]