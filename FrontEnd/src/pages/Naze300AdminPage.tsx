import React, { useState, useEffect } from 'react';
import { HomePageHeader, MainNavigation } from '../components/homePageComp';
import { getCsrfToken } from '../utils';

interface Naze300Question {
  id: number;
  question_id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'basic' | 'intermediate' | 'advanced';
  hand_tiles: string;
  discard_options: string[];
  correct_discard: string;
  correct_reason: string;
  additional_notes: string;
  total_attempts: number;
  correct_attempts: number;
  correct_rate: number;
}

interface QuestionFormData {
  question_id: number;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'basic' | 'intermediate' | 'advanced';
  hand_tiles: string;
  discard_options: string[];
  round_wind: string;
  player_wind: string;
  tsumi_number: number;
  dora_indicators: string;
  ura_dora_indicators: string;
  correct_discard: string;
  correct_reason: string;
  additional_notes: string;
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: '简单' },
  { value: 'medium', label: '中等' },
  { value: 'hard', label: '困难' }
];

const CATEGORY_OPTIONS = [
  { value: 'basic', label: '基础' },
  { value: 'intermediate', label: '进阶' },
  { value: 'advanced', label: '高级' }
];

export default function Naze300AdminPage() {
  const [questions, setQuestions] = useState<Naze300Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Naze300Question | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<QuestionFormData>({
    question_id: 0,
    title: '',
    difficulty: 'easy',
    category: 'basic',
    hand_tiles: '',
    discard_options: [],
    round_wind: '东',
    player_wind: '东',
    tsumi_number: 0,
    dora_indicators: '',
    ura_dora_indicators: '',
    correct_discard: '',
    correct_reason: '',
    additional_notes: ''
  });
  const [discardOptionsText, setDiscardOptionsText] = useState('');
  const [editingLoading, setEditingLoading] = useState(false);

  // 获取题目列表
  const fetchQuestions = async () => {
    try {
      const response = await fetch('/api/mahjong/naze300/');
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.results);
      }
    } catch (error) {
      console.error('获取题目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // 开始编辑题目
  const startEdit = async (question: Naze300Question) => {
    setEditingLoading(true);
    try {
      // 从API获取最新的题目数据
      const response = await fetch(`/api/mahjong/naze300/${question.question_id}/`);
      if (response.ok) {
        const fullQuestionData = await response.json();
        setEditingQuestion(fullQuestionData);
        setFormData({
          question_id: fullQuestionData.question_id,
          title: fullQuestionData.title || '',
          difficulty: fullQuestionData.difficulty,
          category: fullQuestionData.category,
          hand_tiles: fullQuestionData.hand_tiles || '',
          discard_options: fullQuestionData.discard_options || [],
          round_wind: fullQuestionData.round_wind || '东',
          player_wind: fullQuestionData.player_wind || '东',
          tsumi_number: fullQuestionData.tsumi_number || 0,
          dora_indicators: fullQuestionData.dora_indicators || '',
          ura_dora_indicators: fullQuestionData.ura_dora_indicators || '',
          correct_discard: fullQuestionData.correct_discard || '',
          correct_reason: fullQuestionData.correct_reason || '',
          additional_notes: fullQuestionData.additional_notes || ''
        });
        setDiscardOptionsText(JSON.stringify(fullQuestionData.discard_options || [], null, 2));
        setShowForm(true);
      } else {
        alert('获取题目详情失败，请重试');
      }
    } catch (error) {
      console.error('获取题目详情失败:', error);
      alert('获取题目详情失败，请重试');
    } finally {
      setEditingLoading(false);
    }
  };

  // 开始新建题目
  const startNew = () => {
    const nextId = questions.length > 0 ? Math.max(...questions.map(q => q.question_id)) + 1 : 1;
    setEditingQuestion(null);
    setFormData({
      question_id: nextId,
      title: '',
      difficulty: 'easy',
      category: 'basic',
      hand_tiles: '',
      discard_options: [],
      round_wind: '东',
      player_wind: '东',
      tsumi_number: 0,
      dora_indicators: '',
      ura_dora_indicators: '',
      correct_discard: '',
      correct_reason: '',
      additional_notes: ''
    });
    setDiscardOptionsText('[]');
    setShowForm(true);
  };

  // 保存题目
  const saveQuestion = async () => {
    try {
      // 确保字符串字段不为 undefined
      const safeFormData = {
        ...formData,
        title: formData.title || '',
        hand_tiles: formData.hand_tiles || '',
        round_wind: formData.round_wind || '东',
        player_wind: formData.player_wind || '东',
        tsumi_number: formData.tsumi_number || 0,
        dora_indicators: formData.dora_indicators || '',
        ura_dora_indicators: formData.ura_dora_indicators || '',
        correct_discard: formData.correct_discard || '',
        correct_reason: formData.correct_reason || '',
        additional_notes: formData.additional_notes || '',
        discard_options: formData.discard_options || []
      };

      // 验证数据
      if (!safeFormData.title.trim()) {
        alert('请输入题目标题');
        return;
      }
      if (!safeFormData.hand_tiles.trim()) {
        alert('请输入手牌');
        return;
      }
      if (safeFormData.discard_options.length < 2) {
        alert('至少需要2个切牌选项');
        return;
      }
      if (!safeFormData.correct_discard) {
        alert('请选择正确答案');
        return;
      }
      if (!safeFormData.discard_options.includes(safeFormData.correct_discard)) {
        alert('正确答案必须在选项列表中');
        return;
      }

      const method = editingQuestion ? 'PUT' : 'POST';
      const url = editingQuestion
        ? `/api/mahjong/naze300/${editingQuestion.question_id}/`
        : '/api/mahjong/naze300/';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || '',
        },
        body: JSON.stringify(safeFormData)
      });

      if (response.ok) {
        alert(editingQuestion ? '题目更新成功！' : '题目创建成功！');
        setShowForm(false);
        fetchQuestions();
      } else {
        const error = await response.json();
        alert('保存失败: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('保存题目失败:', error);
      alert('保存失败，请重试');
    }
  };

  // 删除题目
  const deleteQuestion = async (question: Naze300Question) => {
    if (!confirm(`确定要删除题目 "${question.title}" 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`/api/mahjong/naze300/${question.question_id}/`, {
        method: 'DELETE',
        headers: {
          'X-CSRFToken': getCsrfToken() || '',
        }
      });

      if (response.ok) {
        alert('题目删除成功！');
        fetchQuestions();
      } else {
        alert('删除失败');
      }
    } catch (error) {
      console.error('删除题目失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 更新表单数据
  const updateFormData = (field: keyof QuestionFormData, value: any) => {
    // 确保字符串字段不为 undefined
    const safeValue = (field === 'title' || field === 'hand_tiles' || field === 'round_wind' || field === 'player_wind' || field === 'dora_indicators' || field === 'ura_dora_indicators' || field === 'correct_discard' || field === 'correct_reason' || field === 'additional_notes')
      ? (value || '')
      : value;
    setFormData(prev => ({ ...prev, [field]: safeValue }));
  };

  // 更新切牌选项
  const updateDiscardOptions = (text: string) => {
    setDiscardOptionsText(text);
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        updateFormData('discard_options', parsed);
      }
    } catch (error) {
      // JSON解析失败，暂时不更新
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        <HomePageHeader />
        <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
          <MainNavigation />
        </nav>
        <main className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="text-slate-600 dark:text-slate-400">加载中...</div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <HomePageHeader />
      <nav className="container mx-auto px-4 py-4 border-b border-gray-200 dark:border-slate-700">
        <MainNavigation />
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            何切300问管理
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            管理系统中的何切300问题目
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="mb-6">
          <button
            onClick={startNew}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            新建题目
          </button>
        </div>

        {/* 题目列表 */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    标题
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    难度
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    分类
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    正确率
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {questions.map((question) => (
                  <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-slate-700">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {question.question_id}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-900 dark:text-white max-w-xs truncate">
                      {question.title}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {question.difficulty === 'easy' ? '简单' :
                       question.difficulty === 'medium' ? '中等' : '困难'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {question.category === 'basic' ? '基础' :
                       question.category === 'intermediate' ? '进阶' : '高级'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                      {question.correct_rate}%
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => startEdit(question)}
                        disabled={editingLoading}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingLoading ? '加载中...' : '编辑'}
                      </button>
                      <button
                        onClick={() => deleteQuestion(question)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 编辑表单 */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                  {editingQuestion ? '编辑题目' : '新建题目'}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 基本信息 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        题目ID
                      </label>
                      <input
                        type="number"
                        value={formData.question_id}
                        onChange={(e) => updateFormData('question_id', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        题目标题
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => updateFormData('title', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="请输入题目标题"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        难度
                      </label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => updateFormData('difficulty', e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        {DIFFICULTY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        分类
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => updateFormData('category', e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        {CATEGORY_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 题目内容 */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        手牌 (14张)
                      </label>
                      <input
                        type="text"
                        value={formData.hand_tiles}
                        onChange={(e) => updateFormData('hand_tiles', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        placeholder="例如: 1m2m3m4m5m6m7m8m9m1p1p1p2p"
                      />
                    </div>

                    {/* 场况信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          场风
                        </label>
                        <select
                          value={formData.round_wind}
                          onChange={(e) => updateFormData('round_wind', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="东">东</option>
                          <option value="南">南</option>
                          <option value="西">西</option>
                          <option value="北">北</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          自风
                        </label>
                        <select
                          value={formData.player_wind}
                          onChange={(e) => updateFormData('player_wind', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                        >
                          <option value="东">东</option>
                          <option value="南">南</option>
                          <option value="西">西</option>
                          <option value="北">北</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          本场数
                        </label>
                        <input
                          type="number"
                          value={formData.tsumi_number}
                          onChange={(e) => updateFormData('tsumi_number', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* 宝牌信息 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          宝牌指示牌
                        </label>
                        <input
                          type="text"
                          value={formData.dora_indicators}
                          onChange={(e) => updateFormData('dora_indicators', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          placeholder="例如: 5m"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                          里宝牌指示牌
                        </label>
                        <input
                          type="text"
                          value={formData.ura_dora_indicators}
                          onChange={(e) => updateFormData('ura_dora_indicators', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                          placeholder="例如: 6m"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        切牌选项 (JSON格式)
                      </label>
                      <textarea
                        value={discardOptionsText}
                        onChange={(e) => updateDiscardOptions(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-mono text-sm"
                        placeholder='["1m", "9m", "1p"]'
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        正确答案
                      </label>
                      <select
                        value={formData.correct_discard}
                        onChange={(e) => updateFormData('correct_discard', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="">请选择正确答案</option>
                        {formData.discard_options.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* 解析说明 */}
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      正确切牌理由
                    </label>
                    <textarea
                      value={formData.correct_reason}
                      onChange={(e) => updateFormData('correct_reason', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="请输入解析理由"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      补充说明 (可选)
                    </label>
                    <textarea
                      value={formData.additional_notes}
                      onChange={(e) => updateFormData('additional_notes', e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      placeholder="请输入补充说明"
                    />
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={saveQuestion}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {editingQuestion ? '更新' : '创建'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}