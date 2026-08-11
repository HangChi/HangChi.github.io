---
title: 常见数据结构定义(Java)
description: LeetCode 刷题中常用的数据结构定义模板，包含 ListNode、TreeNode、TrieNode、UnionFind 等 17 种常见结构及其使用场景。
pubDate: 2026-06-27
category: leetcode
tags:
  - LeetCode
  - 模板
draft: false
pinned: false
---
## 1. 单链表节点 ListNode

常见题目：

- 206. 反转链表
- 21. 合并两个有序链表
- 141. 环形链表
- 142. 环形链表 II
- 19. 删除链表的倒数第 N 个结点

```java
/**
 * Definition for singly-linked list.
 */
public class ListNode {
    int val;
    ListNode next;

    ListNode() {}

    ListNode(int val) {
        this.val = val;
    }

    ListNode(int val, ListNode next) {
        this.val = val;
        this.next = next;
    }
}
```

## 2. 二叉树节点 TreeNode

常见题目：

- 94. 二叉树的中序遍历
- 98. 验证二叉搜索树
- 101. 对称二叉树
- 102. 二叉树的层序遍历
- 104. 二叉树的最大深度
- 236. 二叉树的最近公共祖先

```java
/**
 * Definition for a binary tree node.
 */
public class TreeNode {
    int val;
    TreeNode left;
    TreeNode right;

    TreeNode() {}

    TreeNode(int val) {
        this.val = val;
    }

    TreeNode(int val, TreeNode left, TreeNode right) {
        this.val = val;
        this.left = left;
        this.right = right;
    }
}
```

## 3. 随机链表节点 Node

常见题目：

- 138. 随机链表的复制

```java
/**
 * Definition for a Node.
 */
class Node {
    int val;
    Node next;
    Node random;

    public Node(int val) {
        this.val = val;
        this.next = null;
        this.random = null;
    }
}
```

## 4. 带 next 指针的二叉树节点 Node

常见题目：

- 116. 填充每个节点的下一个右侧节点指针
- 117. 填充每个节点的下一个右侧节点指针 II

```java
/**
 * Definition for a Node.
 */
class Node {
    public int val;
    public Node left;
    public Node right;
    public Node next;

    public Node() {}

    public Node(int val) {
        this.val = val;
    }

    public Node(int val, Node left, Node right, Node next) {
        this.val = val;
        this.left = left;
        this.right = right;
        this.next = next;
    }
}
```

## 5. N 叉树节点 Node

常见题目：

- 429. N 叉树的层序遍历
- 589. N 叉树的前序遍历
- 590. N 叉树的后序遍历

```java
import java.util.*;

/**
 * Definition for a Node.
 */
class Node {
    public int val;
    public List<Node> children;

    public Node() {}

    public Node(int val) {
        this.val = val;
    }

    public Node(int val, List<Node> children) {
        this.val = val;
        this.children = children;
    }
}
```

## 6. 图节点 Node

常见题目：

- 133. 克隆图

```java
import java.util.*;

/**
 * Definition for a Node.
 */
class Node {
    public int val;
    public List<Node> neighbors;

    public Node() {
        val = 0;
        neighbors = new ArrayList<>();
    }

    public Node(int val) {
        this.val = val;
        neighbors = new ArrayList<>();
    }

    public Node(int val, ArrayList<Node> neighbors) {
        this.val = val;
        this.neighbors = neighbors;
    }
}
```

## 7. 前缀树节点 TrieNode

常见题目：

- 208. 实现 Trie
- 211. 添加与搜索单词
- 648. 单词替换

```java
class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd;
}
```

## 8. Trie 完整模板

```java
class Trie {
    private TrieNode root;

    public Trie() {
        root = new TrieNode();
    }

    // 插入单词
    public void insert(String word) {
        TrieNode cur = root;

        for (char c : word.toCharArray()) {
            int index = c - 'a';

            if (cur.children[index] == null) {
                cur.children[index] = new TrieNode();
            }

            cur = cur.children[index];
        }

        cur.isEnd = true;
    }

    // 查找完整单词
    public boolean search(String word) {
        TrieNode node = findNode(word);
        return node != null && node.isEnd;
    }

    // 判断是否存在某个前缀
    public boolean startsWith(String prefix) {
        return findNode(prefix) != null;
    }

    // 找到 word 或 prefix 对应的最后一个节点
    private TrieNode findNode(String word) {
        TrieNode cur = root;

        for (char c : word.toCharArray()) {
            int index = c - 'a';

            if (cur.children[index] == null) {
                return null;
            }

            cur = cur.children[index];
        }

        return cur;
    }
}

class TrieNode {
    TrieNode[] children = new TrieNode[26];
    boolean isEnd;
}
```

## 9. 并查集 UnionFind

常见题目：

- 200. 岛屿数量
- 547. 省份数量
- 684. 冗余连接
- 990. 等式方程的可满足性

```java
class UnionFind {
    int[] parent;
    int[] rank;

    public UnionFind(int n) {
        parent = new int[n];
        rank = new int[n];

        // 初始时，每个节点的父节点都是自己
        for (int i = 0; i < n; i++) {
            parent[i] = i;
            rank[i] = 1;
        }
    }

    // 查找 x 的根节点
    public int find(int x) {
        if (parent[x] != x) {
            // 路径压缩
            parent[x] = find(parent[x]);
        }

        return parent[x];
    }

    // 合并 x 和 y 所在的集合
    public void union(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);

        if (rootX == rootY) return;

        // 按秩合并
        if (rank[rootX] < rank[rootY]) {
            parent[rootX] = rootY;
        } else if (rank[rootX] > rank[rootY]) {
            parent[rootY] = rootX;
        } else {
            parent[rootY] = rootX;
            rank[rootX]++;
        }
    }

    // 判断 x 和 y 是否属于同一个集合
    public boolean isConnected(int x, int y) {
        return find(x) == find(y);
    }
}
```

## 10. 二维坐标节点 Point

常见题目：

- 矩阵 BFS
- 矩阵 DFS
- 岛屿问题
- 迷宫问题

```java
class Point {
    int x;
    int y;

    Point(int x, int y) {
        this.x = x;
        this.y = y;
    }
}
```

## 11. 键值对节点 Pair

常见题目：

- 23. 合并 K 个升序链表
- 347. 前 K 个高频元素
- 373. 查找和最小的 K 对数字

```java
class Pair {
    int key;
    int value;

    Pair(int key, int value) {
        this.key = key;
        this.value = value;
    }
}
```

优先队列常见写法：

```java
import java.util.*;

// 小根堆：按照 value 从小到大排序
PriorityQueue<Pair> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.value, b.value));
```

## 12. 双向链表节点 DoubleListNode

常见题目：

- 146. LRU 缓存
- 460. LFU 缓存

```java
class DoubleListNode {
    int key;
    int value;
    DoubleListNode prev;
    DoubleListNode next;

    DoubleListNode() {}

    DoubleListNode(int key, int value) {
        this.key = key;
        this.value = value;
    }
}
```

## 13. 带频率的节点 FreqNode

常见题目：

- 460. LFU 缓存
- 347. 前 K 个高频元素

```java
class FreqNode {
    int key;
    int value;
    int freq;

    FreqNode(int key, int value, int freq) {
        this.key = key;
        this.value = value;
        this.freq = freq;
    }
}
```

## 14. 区间节点 Interval

常见题目：

- 56. 合并区间
- 57. 插入区间
- 435. 无重叠区间
- 452. 用最少数量的箭引爆气球

```java
class Interval {
    int start;
    int end;

    Interval() {}

    Interval(int start, int end) {
        this.start = start;
        this.end = end;
    }
}
```

## 15. 树节点带父指针 TreeNodeWithParent

常见题目：

- 二叉树最近公共祖先变形题
- 向上查找父节点的问题

```java
class TreeNodeWithParent {
    int val;
    TreeNodeWithParent left;
    TreeNodeWithParent right;
    TreeNodeWithParent parent;

    TreeNodeWithParent(int val) {
        this.val = val;
    }
}
```

## 16. 链表带随机指针 RandomListNode

有些题目中也可能写成 `RandomListNode`。

```java
class RandomListNode {
    int val;
    RandomListNode next;
    RandomListNode random;

    RandomListNode(int val) {
        this.val = val;
    }
}
```

## 17. 最常见结构总结

刷题中最常见的是：

```java
ListNode       // 单链表
TreeNode       // 二叉树
Node           // 特殊节点，具体看题目定义
TrieNode       // 前缀树节点
UnionFind      // 并查集
Point          // 二维坐标
Pair           // 键值对 / 优先队列辅助节点
Interval       // 区间节点
```

## 18. 注意事项

### 18.1 LeetCode 中很多结构已经定义好

例如：

```java
ListNode
TreeNode
Node
```

这些结构在题目中通常已经给出，提交代码时一般不需要自己再写一遍。

### 18.2 不同题目中的 Node 含义不一样

`Node` 在不同题目中可能表示不同结构：

```java
// 随机链表节点
Node next;
Node random;

// 带 next 指针的二叉树节点
Node left;
Node right;
Node next;

// N 叉树节点
List<Node> children;

// 图节点
List<Node> neighbors;
```

所以看到 `Node` 时，一定要先看题目给出的定义。

### 18.3 优先队列比较器建议使用 Integer.compare

不推荐：

```java
PriorityQueue<Pair> pq = new PriorityQueue<>((a, b) -> a.value - b.value);
```

更推荐：

```java
PriorityQueue<Pair> pq = new PriorityQueue<>((a, b) -> Integer.compare(a.value, b.value));
```

原因是 `a.value - b.value` 在极端情况下可能出现整数溢出。

### 18.4 Java 中常见集合导入

```java
import java.util.*;
```

刷题中常用的集合：

```java
ArrayList
LinkedList
HashMap
HashSet
Queue
Deque
PriorityQueue
Stack
Arrays
Collections
```
