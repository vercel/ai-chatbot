// Taken from https://github.com/hamflx/prosemirror-diff/blob/master/src/diff.js

import { diff_match_patch } from 'diff-match-patch';
import { Fragment, Node } from 'prosemirror-model';

import { DiffType } from './DiffType.js';

export const patchDocumentNode = (schema, oldNode, newNode) => {
  assertNodeTypeEqual(oldNode, newNode);

  const finalLeftChildren = [];
  const finalRightChildren = [];

  const oldChildren = normalizeNodeContent(oldNode);
  const newChildren = normalizeNodeContent(newNode);
  const oldChildLen = oldChildren.length;
  const newChildLen = newChildren.length;
  const minChildLen = Math.min(oldChildLen, newChildLen);

  let left = 0;
  let right = 0;

  // console.log("==> searching same left");
  for (; left < minChildLen; left++) {
    const oldChild = oldChildren[left];
    const newChild = newChildren[left];
    if (!isNodeEqual(oldChild, newChild)) {
      break;
    }
    finalLeftChildren.push(...ensureArray(oldChild));
  }

  // console.log("==> searching same right");
  for (; right + left + 1 < minChildLen; right++) {
    const oldChild = oldChildren[oldChildLen - right - 1];
    const newChild = newChildren[newChildLen - right - 1];
    if (!isNodeEqual(oldChild, newChild)) {
      break;
    }
    finalRightChildren.unshift(...ensureArray(oldChild));
  }

  // console.log(
  //   `==> eq left:${left}, right:${right}`,
  //   [...finalLeftChildren],
  //   [...finalRightChildren],
  // );

  const diffOldChildren = oldChildren.slice(left, oldChildLen - right);
  const diffNewChildren = newChildren.slice(left, newChildLen - right);
  // console.log(
  //   "==> diff children",
  //   diffOldChildren.length,
  //   diffNewChildren.length,
  // );
  if (diffOldChildren.length && diffNewChildren.length) {
    const matchedNodes = matchNodes(
      schema,
      diffOldChildren,
      diffNewChildren
    ).sort((a, b) => b.count - a.count);
    const bestMatch = matchedNodes[0];
    if (bestMatch) {
      // console.log("==> bestMatch", bestMatch);
      const { oldStartIndex, newStartIndex, oldEndIndex, newEndIndex } =
        bestMatch;
      const oldBeforeMatchChildren = diffOldChildren.slice(0, oldStartIndex);
      const newBeforeMatchChildren = diffNewChildren.slice(0, newStartIndex);
      // console.log(
      //   "==> before match",
      //   oldBeforeMatchChildren.length,
      //   newBeforeMatchChildren.length,
      //   oldBeforeMatchChildren,
      //   newBeforeMatchChildren,
      // );
      finalLeftChildren.push(
        ...patchRemainNodes(
          schema,
          oldBeforeMatchChildren,
          newBeforeMatchChildren
        )
      );
      finalLeftChildren.push(
        ...diffOldChildren.slice(oldStartIndex, oldEndIndex)
      );
      // console.log("==> match", oldEndIndex - oldStartIndex);

      const oldAfterMatchChildren = diffOldChildren.slice(oldEndIndex);
      const newAfterMatchChildren = diffNewChildren.slice(newEndIndex);
      // console.log(
      //   "==> after match",
      //   oldAfterMatchChildren.length,
      //   newAfterMatchChildren.length,
      // );
      finalRightChildren.unshift(
        ...patchRemainNodes(
          schema,
          oldAfterMatchChildren,
          newAfterMatchChildren
        )
      );
    } else {
      // console.log("==> no best match found");
      finalLeftChildren.push(
        ...patchRemainNodes(schema, diffOldChildren, diffNewChildren)
      );
    }
    // console.log("==> matchedNodes", matchedNodes);
  } else {
    finalLeftChildren.push(
      ...patchRemainNodes(schema, diffOldChildren, diffNewChildren)
    );
  }

  return createNewNode(oldNode, [...finalLeftChildren, ...finalRightChildren]);
};

const matchNodes = (schema, oldChildren, newChildren) => {
  // console.log("==> matchNodes", oldChildren, newChildren);
  const matches = [];
  for (
    let oldStartIndex = 0;
    oldStartIndex < oldChildren.length;
    oldStartIndex++
  ) {
    const oldStartNode = oldChildren[oldStartIndex];
    const newStartIndex = findMatchNode(newChildren, oldStartNode);

    if (newStartIndex !== -1) {
      let oldEndIndex = oldStartIndex + 1;
      let newEndIndex = newStartIndex + 1;
      for (
        ;
        oldEndIndex < oldChildren.length && newEndIndex < newChildren.length;
        oldEndIndex++, newEndIndex++
      ) {
        const oldEndNode = oldChildren[oldEndIndex];
        if (!isNodeEqual(newChildren[newEndIndex], oldEndNode)) {
          break;
        }
      }
      // console.log(
      //   "==> match",
      //   oldStartIndex,
      //   oldEndIndex,
      //   newStartIndex,
      //   newEndIndex,
      // );
      matches.push({
        oldStartIndex,
        newStartIndex,
        oldEndIndex,
        newEndIndex,
        count: newEndIndex - newStartIndex,
      });
    }
  }
  return matches;
};

const findMatchNode = (children, node, startIndex = 0) => {
  for (let i = startIndex; i < children.length; i++) {
    if (isNodeEqual(children[i], node)) {
      return i;
    }
  }
  return -1;
};

const patchRemainNodes = (schema, oldChildren, newChildren) => {
  const finalLeftChildren = [];
  const finalRightChildren = [];
  const oldChildLen = oldChildren.length;
  const newChildLen = newChildren.length;
  let left = 0;
  let right = 0;
  while (oldChildLen - left - right > 0 && newChildLen - left - right > 0) {
    const leftOldNode = oldChildren[left];
    const leftNewNode = newChildren[left];
    const rightOldNode = oldChildren[oldChildLen - right - 1];
    const rightNewNode = newChildren[newChildLen - right - 1];
    let updateLeft =
      !isTextNode(leftOldNode) && matchNodeType(leftOldNode, leftNewNode);
    let updateRight =
      !isTextNode(rightOldNode) && matchNodeType(rightOldNode, rightNewNode);
    if (Array.isArray(leftOldNode) && Array.isArray(leftNewNode)) {
      finalLeftChildren.push(
        ...patchTextNodes(schema, leftOldNode, leftNewNode)
      );
      left += 1;
      continue;
    }

    if (updateLeft && updateRight) {
      const equalityLeft = computeChildEqualityFactor(leftOldNode, leftNewNode);
      const equalityRight = computeChildEqualityFactor(
        rightOldNode,
        rightNewNode
      );
      if (equalityLeft < equalityRight) {
        updateLeft = false;
      } else {
        updateRight = false;
      }
    }
    if (updateLeft) {
      finalLeftChildren.push(
        patchDocumentNode(schema, leftOldNode, leftNewNode)
      );
      left += 1;
    } else if (updateRight) {
      finalRightChildren.unshift(
        patchDocumentNode(schema, rightOldNode, rightNewNode)
      );
      right += 1;
    } else {
      // todo
      finalLeftChildren.push(
        createDiffNode(schema, leftOldNode, DiffType.Deleted)
      );
      finalLeftChildren.push(
        createDiffNode(schema, leftNewNode, DiffType.Inserted)
      );
      left += 1;
      // delete and insert
    }
  }

  const deleteNodeLen = oldChildLen - left - right;
  const insertNodeLen = newChildLen - left - right;
  if (deleteNodeLen) {
    finalLeftChildren.push(
      ...oldChildren
        .slice(left, left + deleteNodeLen)
        .flat()
        .map((node) => createDiffNode(schema, node, DiffType.Deleted))
    );
  }

  if (insertNodeLen) {
    finalRightChildren.unshift(
      ...newChildren
        .slice(left, left + insertNodeLen)
        .flat()
        .map((node) => createDiffNode(schema, node, DiffType.Inserted))
    );
  }

  return [...finalLeftChildren, ...finalRightChildren];
};

export const patchTextNodes = (schema, oldNode, newNode) => {
  const dmp = new diff_match_patch();
  const oldText = oldNode.map((n) => getNodeText(n)).join('');
  const newText = newNode.map((n) => getNodeText(n)).join('');
  const diff = dmp.diff_main(oldText, newText);
  let oldLen = 0;
  let newLen = 0;
  const res = diff
    .map((d) => {
      const [type, content] = [d[0], d[1]];
      const node = createTextNode(
        schema,
        content,
        type !== DiffType.Unchanged ? createDiffMark(schema, type) : []
      );
      const oldFrom = oldLen;
      const oldTo = oldFrom + (type === DiffType.Inserted ? 0 : content.length);
      const newFrom = newLen;
      const newTo = newFrom + (type === DiffType.Deleted ? 0 : content.length);
      oldLen = oldTo;
      newLen = newTo;
      return { node, type, oldFrom, oldTo, newFrom, newTo };
    })
    .map(({ node, type, oldFrom, oldTo, newFrom, newTo }) => {
      if (type === DiffType.Deleted) {
        const textItems = findTextNodes(oldNode, oldFrom, oldTo).filter(
          (n) => Object.keys(n.node.attrs ?? {}).length || n.node.marks?.length
        );
        return applyTextNodeAttrsMarks(schema, node, oldFrom, textItems);
      } else {
        const textItems = findTextNodes(newNode, newFrom, newTo).filter(
          (n) => Object.keys(n.node.attrs ?? {}).length || n.node.marks?.length
        );
        return applyTextNodeAttrsMarks(schema, node, newFrom, textItems);
      }
    });
  return res.flat(Infinity);
};

const findTextNodes = (textNodes, from, to) => {
  const result = [];
  let start = 0;
  for (let i = 0; i < textNodes.length && start < to; i++) {
    const node = textNodes[i];
    const text = getNodeText(node);
    const end = start + text.length;
    const intersect =
      (start >= from && start < to) ||
      (end > from && end <= to) ||
      (start <= from && end >= to);
    if (intersect) {
      result.push({ node, from: start, to: end });
    }
    start += text.length;
  }
  return result;
};

const applyTextNodeAttrsMarks = (schema, node, base, textItems) => {
  if (!textItems.length) {
    return node;
  }

  const baseMarks = node.marks ?? [];
  const firstItem = textItems[0];
  const nodeText = getNodeText(node);
  const nodeEnd = base + nodeText.length;
  const result = [];
  if (firstItem.from - base > 0) {
    result.push(
      createTextNode(
        schema,
        nodeText.slice(0, firstItem.from - base),
        baseMarks
      )
    );
  }
  for (let i = 0; i < textItems.length; i++) {
    const { from, node: textNode, to } = textItems[i];
    result.push(
      createTextNode(
        schema,
        nodeText.slice(Math.max(from, base) - base, to - base),
        [...baseMarks, ...(textNode.marks ?? [])]
      )
    );
    const nextFrom = i + 1 < textItems.length ? textItems[i + 1].from : nodeEnd;
    if (nextFrom > to) {
      result.push(
        createTextNode(
          schema,
          nodeText.slice(to - base, nextFrom - base),
          baseMarks
        )
      );
    }
  }
  return result;
};

export const computeChildEqualityFactor = (node1, node2) => {
  return 0;
};

export const assertNodeTypeEqual = (node1, node2) => {
  if (getNodeProperty(node1, 'type') !== getNodeProperty(node2, 'type')) {
    throw new Error(`node type not equal: ${node1.type} !== ${node2.type}`);
  }
};

export const ensureArray = (value) => {
  return Array.isArray(value) ? value : [value];
};

export const isNodeEqual = (node1, node2) => {
  const isNode1Array = Array.isArray(node1);
  const isNode2Array = Array.isArray(node2);
  if (isNode1Array !== isNode2Array) {
    return false;
  }
  if (isNode1Array) {
    return (
      node1.length === node2.length &&
      node1.every((node, index) => isNodeEqual(node, node2[index]))
    );
  }

  const type1 = getNodeProperty(node1, 'type');
  const type2 = getNodeProperty(node2, 'type');
  if (type1 !== type2) {
    return false;
  }
  if (isTextNode(node1)) {
    const text1 = getNodeProperty(node1, 'text');
    const text2 = getNodeProperty(node2, 'text');
    if (text1 !== text2) {
      return false;
    }
  }
  const attrs1 = getNodeAttributes(node1);
  const attrs2 = getNodeAttributes(node2);
  const attrs = [...new Set([...Object.keys(attrs1), ...Object.keys(attrs2)])];
  for (const attr of attrs) {
    if (attrs1[attr] !== attrs2[attr]) {
      return false;
    }
  }
  const marks1 = getNodeMarks(node1);
  const marks2 = getNodeMarks(node2);
  if (marks1.length !== marks2.length) {
    return false;
  }
  for (let i = 0; i < marks1.length; i++) {
    if (!isNodeEqual(marks1[i], marks2[i])) {
      return false;
    }
  }
  const children1 = getNodeChildren(node1);
  const children2 = getNodeChildren(node2);
  if (children1.length !== children2.length) {
    return false;
  }
  for (let i = 0; i < children1.length; i++) {
    if (!isNodeEqual(children1[i], children2[i])) {
      return false;
    }
  }
  return true;
};

export const normalizeNodeContent = (node) => {
  const content = getNodeChildren(node) ?? [];
  const res = [];
  for (let i = 0; i < content.length; i++) {
    const child = content[i];
    if (isTextNode(child)) {
      const textNodes = [];
      for (
        let textNode = content[i];
        i < content.length && isTextNode(textNode);
        textNode = content[++i]
      ) {
        textNodes.push(textNode);
      }
      i--;
      res.push(textNodes);
    } else {
      res.push(child);
    }
  }
  return res;
};

export const getNodeProperty = (node, property) => {
  if (property === 'type') {
    return node.type?.name;
  }
  return node[property];
};
export const getNodeAttribute = (node, attribute) =>
  node.attrs ? node.attrs[attribute] : undefined;
export const getNodeAttributes = (node) =>
  node.attrs ? node.attrs : undefined;
export const getNodeMarks = (node) => node.marks ?? [];
export const getNodeChildren = (node) => node.content?.content ?? [];
export const getNodeText = (node) => node.text;
export const isTextNode = (node) => node.type?.name === 'text';
export const matchNodeType = (node1, node2) =>
  node1.type?.name === node2.type?.name ||
  (Array.isArray(node1) && Array.isArray(node2));
export const createNewNode = (oldNode, children) => {
  if (!oldNode.type) {
    throw new Error('oldNode.type is undefined');
  }
  return new Node(
    oldNode.type,
    oldNode.attrs,
    Fragment.fromArray(children),
    oldNode.marks
  );
};
export const createDiffNode = (schema, node, type) => {
  return mapDocumentNode(node, (node) => {
    if (isTextNode(node)) {
      return createTextNode(schema, getNodeText(node), [
        ...(node.marks || []),
        createDiffMark(schema, type),
      ]);
    }
    return node;
  });
};
function mapDocumentNode(node, mapper) {
  const copy = node.copy(
    Fragment.from(
      node.content.content
        .map((node) => mapDocumentNode(node, mapper))
        .filter((n) => n)
    )
  );
  return mapper(copy) || copy;
}
export const createDiffMark = (schema, type) => {
  if (type === DiffType.Inserted) {
    return schema.mark('diffMark', { type });
  }
  if (type === DiffType.Deleted) {
    return schema.mark('diffMark', { type });
  }
  throw new Error('type is not valid');
};
export const createTextNode = (schema, content, marks = []) => {
  return schema.text(content, marks);
};

export const diffEditor = (schema, oldDoc, newDoc) => {
  const oldNode = Node.fromJSON(schema, oldDoc);
  const newNode = Node.fromJSON(schema, newDoc);
  return patchDocumentNode(schema, oldNode, newNode);
};
