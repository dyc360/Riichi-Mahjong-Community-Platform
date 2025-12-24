# 测试报告文件夹

此文件夹包含所有测试相关的报告和结果文件。

## 文件说明

### 测试结果文件

- **`test_results.txt`** - 详细的测试执行结果
  - 包含所有测试用例的执行情况（92个测试）
  - 测试通过/失败信息
  - 错误堆栈跟踪（如果有）

### 覆盖率报告文件

- **`coverage_report.txt`** - 文本格式的覆盖率报告
  - 各模块的代码覆盖率统计
  - 未覆盖代码行数
  - 当前覆盖率：**84%**

- **`COVERAGE_REPORT.md`** - 详细的覆盖率分析报告
  - 各模块覆盖率详情
  - 未覆盖代码分析
  - 改进建议

### 综合测试报告

- **`TEST_REPORT.md`** - 完整的测试报告
  - 测试执行摘要（92个测试，全部通过）
  - 各模块测试详情
  - 覆盖率统计（84%）
  - 测试质量分析
  - 端到端测试详情

## 测试统计

- **总测试数：** 92
- **通过：** 92
- **失败：** 0
- **错误：** 0
- **覆盖率：** 84%
- **测试类型：** 单元测试、集成测试、API测试、端到端测试

## 查看 HTML 覆盖率报告

HTML 格式的交互式覆盖率报告位于项目根目录的 `htmlcov/` 文件夹中，可以在浏览器中打开 `htmlcov/index.html` 查看。

## 生成时间

这些报告文件在每次运行测试后会自动更新。最新的报告反映了当前代码的测试状态和覆盖率。

## 运行测试

```bash
# 运行所有测试
cd Backend
python manage.py test

# 运行特定模块测试
python manage.py test auth_api
python manage.py test forum_api
python manage.py test news_api
python manage.py test e2e_tests

# 生成覆盖率报告
python -m coverage run --source='.' manage.py test
python -m coverage report
python -m coverage html
```

