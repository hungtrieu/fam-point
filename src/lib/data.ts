export type User = {
  id: string;
  name: string;
  role: 'parent' | 'child';
  avatar: string;
  points?: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  points: number;
  assignedTo: string; // child's user id
  status: 'todo' | 'completed' | 'approved';
  createdAt: string;
};

export type Reward = {
  id: string;
  name: string;
  description: string;
  points: number;
  image: string;
};

export type PointHistory = {
  id: string;
  userId: string;
  type: 'earn' | 'redeem';
  description: string;
  points: number;
  date: string;
};

export const users: User[] = [
  {
    id: 'user_parent_1',
    name: 'Mẹ',
    role: 'parent',
    avatar: '1',
  },
  {
    id: 'user_child_1',
    name: 'An',
    role: 'child',
    avatar: '2',
    points: 125,
  },
  {
    id: 'user_child_2',
    name: 'Bình',
    role: 'child',
    avatar: '3',
    points: 80,
  },
];

export const tasks: Task[] = [
  {
    id: 'task_1',
    title: 'Dọn dẹp phòng ngủ',
    description: 'Gấp chăn, dọn đồ chơi và lau bụi bàn học.',
    points: 10,
    assignedTo: 'user_child_1',
    status: 'todo',
    createdAt: '2023-10-26T10:00:00Z',
  },
  {
    id: 'task_2',
    title: 'Tưới cây ngoài ban công',
    description: 'Tưới nước cho tất cả các chậu cây.',
    points: 5,
    assignedTo: 'user_child_1',
    status: 'completed',
    createdAt: '2023-10-26T11:00:00Z',
  },
  {
    id: 'task_3',
    title: 'Làm bài tập về nhà',
    description: 'Hoàn thành bài tập toán và tiếng Việt.',
    points: 15,
    assignedTo: 'user_child_2',
    status: 'todo',
    createdAt: '2023-10-25T15:00:00Z',
  },
  {
    id: 'task_4',
    title: 'Phụ mẹ nhặt rau',
    description: 'Nhặt và rửa rau để chuẩn bị bữa tối.',
    points: 5,
    assignedTo: 'user_child_2',
    status: 'approved',
    createdAt: '2023-10-24T18:00:00Z',
  },
    {
    id: 'task_5',
    title: 'Đọc sách 30 phút',
    description: 'Đọc bất kỳ cuốn sách nào con thích.',
    points: 10,
    assignedTo: 'user_child_1',
    status: 'approved',
    createdAt: '2023-10-23T20:00:00Z',
  },
];

export const rewards: Reward[] = [
  {
    id: 'reward_1',
    name: 'Đi xem phim cuối tuần',
    description: 'Một vé xem phim 2D tại rạp chiếu phim gần nhà.',
    points: 50,
    image: '10',
  },
  {
    id: 'reward_2',
    name: 'Bộ đồ chơi Lego mới',
    description: 'Một bộ Lego City trị giá 500,000đ.',
    points: 200,
    image: '11',
  },
  {
    id: 'reward_3',
    name: 'Thêm 30 phút chơi game',
    description: 'Được chơi game thêm 30 phút vào ngày cuối tuần.',
    points: 25,
    image: '12',
  },
  {
    id: 'reward_4',
    name: 'Tiền tiêu vặt 50,000đ',
    description: 'Nhận 50,000đ tiền mặt để mua sắm tùy thích.',
    points: 100,
    image: '13',
  },
];

export const pointHistory: PointHistory[] = [
  {
    id: 'hist_1',
    userId: 'user_child_1',
    type: 'earn',
    description: 'Đọc sách 30 phút',
    points: 10,
    date: '2023-10-25T20:30:00Z',
  },
  {
    id: 'hist_2',
    userId: 'user_child_1',
    type: 'redeem',
    description: 'Đi xem phim cuối tuần',
    points: -50,
    date: '2023-10-22T14:00:00Z',
  },
  {
    id: 'hist_3',
    userId: 'user_child_2',
    type: 'earn',
    description: 'Phụ mẹ nhặt rau',
    points: 5,
    date: '2023-10-24T18:30:00Z',
  },
  {
    id: 'hist_4',
    userId: 'user_child_1',
    type: 'earn',
    description: 'Hoàn thành "Phụ mẹ nhặt rau"',
    points: 5,
    date: '2023-10-24T18:30:00Z',
  }
];
