import { create } from 'zustand';
import { Node, Edge, useEdges, useNodes } from 'reactflow';
import { calculateLayout } from '../utils/layoutUtils';

type WorkflowStore = {
  nodes: Node[];
  edges: Edge[];
  addNodeWithButton: (node: Node) => void;
  removeEdge: (edgeId: string) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, data: any) => void;
  updateLayout: () => void;
};

const initialNodes: Node[] = [
  {
    id: 'start',
    type: 'start',
    position: { x: 0, y: 0 },
    data: { label: 'Start' },
  },
  {
    id: 'replace-start',
    type: 'replace',
    position: { x: 150, y: 0 },
    data: { label: 'Replace Me' },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'start-to-replace',
    source: 'start',
    target: 'replace-start',
    type: 'smoothstep',
  },
];

export const useWorkflowStore = create<WorkflowStore>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,

  updateLayout: () => {
    const { nodes, edges } = get();
    const updatedNodes = calculateLayout(nodes, edges);
    set({ nodes: updatedNodes });
  },

  removeNode: (nodeId: string) => {
    set((state) => {
      const newState = {
        nodes: state.nodes.filter(node => node.id !== nodeId),
        edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
      };
      const updatedNodes = calculateLayout(newState.nodes, newState.edges);
      return { ...newState, nodes: updatedNodes };
    });
  },

  removeEdge: (edgeId: string) => {
    set((state) => {
      const newState = {
        ...state,
        edges: state.edges.filter((edge) => edge.id !== edgeId),
      };
      const updatedNodes = calculateLayout(newState.nodes, newState.edges);
      return { ...newState, nodes: updatedNodes };
    });
  },

  updateNode: (nodeId: string, data: any) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      ),
    }));
  },

  addNodeWithButton: (newNode: Node, selectedReplaceId?: string) => {
    const { nodes, edges } = get();

    const replaceButtonId =
      selectedReplaceId ||
      nodes.find(
        (node) =>
          node.type === 'replace' &&
          edges.some((edge) => edge.target === node.id)
      )?.id;

    if (!replaceButtonId) return;

    const replaceButton = nodes.find((node) => node.id === replaceButtonId);
    if (!replaceButton) return;

    const incomingEdge = edges.find((edge) => edge.target === replaceButtonId);
    if (!incomingEdge) return;

    newNode.position = { ...replaceButton.position };

    const sourceNode = nodes.find((node) => node.id === incomingEdge.source);
    if (!sourceNode) return;

    let newNodes: Node[] = [];
    let newEdges: Edge[] = [];

    const sourceHandle = incomingEdge.sourceHandle;

    if (newNode.type === 'conditional') {
      const trueReplaceButton: Node = {
        id: `replace-${newNode.id}-true`,
        type: 'replace',
        position: { x: newNode.position.x + 150, y: newNode.position.y - 50 },
        data: { label: 'Replace Me' },
      };

      const falseReplaceButton: Node = {
        id: `replace-${newNode.id}-false`,
        type: 'replace',
        position: { x: newNode.position.x + 150, y: newNode.position.y + 50 },
        data: { label: 'Replace Me' },
      };

      newNodes = [
        ...nodes.filter((node) => node.id !== replaceButtonId),
        newNode,
        trueReplaceButton,
        falseReplaceButton,
      ];

      newEdges = [
        ...edges.filter((edge) => edge.target !== replaceButtonId),
        {
          id: `${incomingEdge.source}-to-${newNode.id}`,
          source: incomingEdge.source,
          target: newNode.id,
          sourceHandle: sourceHandle,
          type: 'smoothstep',
        },
        {
          id: `${newNode.id}-to-${trueReplaceButton.id}`,
          source: newNode.id,
          target: trueReplaceButton.id,
          sourceHandle: 'true',
          type: 'smoothstep',
        },
        {
          id: `${newNode.id}-to-${falseReplaceButton.id}`,
          source: newNode.id,
          target: falseReplaceButton.id,
          sourceHandle: 'false',
          type: 'smoothstep',
        },
      ];
    } else if (newNode.type === 'loop') {
      const doneReplaceButton: Node = {
        id: `replace-${newNode.id}-done`,
        type: 'replace',
        position: { x: newNode.position.x + 150, y: newNode.position.y - 50 },
        data: { label: 'Replace Me' },
      };

      const loopReplaceButton: Node = {
        id: `replace-${newNode.id}-loop`,
        type: 'replace',
        position: { x: newNode.position.x + 150, y: newNode.position.y + 50 },
        data: { label: 'Replace Me' },
      };

      newNodes = [
        ...nodes.filter((node) => node.id !== replaceButtonId),
        newNode,
        doneReplaceButton,
        loopReplaceButton,
      ];

      newEdges = [
        ...edges.filter((edge) => edge.target !== replaceButtonId),
        {
          id: `${incomingEdge.source}-to-${newNode.id}`,
          source: incomingEdge.source,
          target: newNode.id,
          sourceHandle: sourceHandle,
          type: 'smoothstep',
        },
        {
          id: `${newNode.id}-to-${doneReplaceButton.id}`,
          source: newNode.id,
          target: doneReplaceButton.id,
          sourceHandle: 'done',
          type: 'smoothstep',
        },
        {
          id: `${newNode.id}-to-${loopReplaceButton.id}`,
          source: newNode.id,
          target: loopReplaceButton.id,
          sourceHandle: 'loop',
          type: 'smoothstep',
        },
      ];
    } else {
      const newReplaceButton: Node = {
        id: `replace-${newNode.id}`,
        type: 'replace',
        position: {
          x: newNode.position.x + 150,
          y: newNode.position.y,
        },
        data: { label: 'Replace Me' },
      };

      newNodes = [
        ...nodes.filter((node) => node.id !== replaceButtonId),
        newNode,
        newReplaceButton,
      ];

      newEdges = [
        ...edges.filter((edge) => edge.target !== replaceButtonId),
        {
          id: `${incomingEdge.source}-to-${newNode.id}`,
          source: incomingEdge.source,
          target: newNode.id,
          sourceHandle: sourceHandle,
          type: 'smoothstep',
        },
        {
          id: `${newNode.id}-to-${newReplaceButton.id}`,
          source: newNode.id,
          target: newReplaceButton.id,
          type: 'smoothstep',
        },
      ];
    }

    const updatedNodes = calculateLayout(newNodes, newEdges);
    set({ nodes: updatedNodes, edges: newEdges });
  },
}));