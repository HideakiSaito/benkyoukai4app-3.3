class EasyGanttEasyIssueQuery < EasyIssueQuery

  attr_accessor :opened_project

  def default_list_columns
    super.presence || ['subject', 'assigned_to']
  end

  def easy_query_entity_controller
    'easy_gantt'
  end

  def easy_query_entity_action
    'issues'
  end

  def entity_easy_query_path(options = {})
    project = options[:project] || self.project
    issues_easy_gantt_path(project, options)
  end

  # Delete these filters because of project_scope
  def initialize_available_filters
    super
    @available_filters.delete('subproject_id')
  end

  def project_scope
    scope = Project.non_templates.active_and_planned

    if opened_project
      scope = scope.where(id: opened_project.id)
    end

    if has_filter?('is_planned')
      op = value_for('is_planned') == '1' ? '=' : '<>'
      scope = scope.where("#{Project.table_name}.status #{op} ?", Project::STATUS_PLANNED)
    end

    scope
  end

  def without_opened_project
    _opened_project = opened_project
    self.opened_project = nil
    self.additional_scope = nil
    yield self
  ensure
    self.opened_project = _opened_project
    self.additional_scope = nil
  end

end
