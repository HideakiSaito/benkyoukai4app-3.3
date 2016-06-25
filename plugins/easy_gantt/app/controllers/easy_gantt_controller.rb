class EasyGanttController < ApplicationController
  accept_api_auth :index, :issues, :projects, :change_issue_relation_delay, :reschedule_project

  before_filter :find_project, only: [:reschedule_project]
  before_filter :find_optional_project, except: [:reschedule_project]
  before_filter :find_optional_opened_project, except: [:reschedule_project]

  before_filter :authorize, if: proc { @project.present? }
  before_filter :authorize_global, if: proc { @project.nil? }

  before_filter :check_rest_api_enabled, only: [:issues]
  before_filter :find_relation, only: [:change_issue_relation_delay]

  menu_item :easy_gantt

  helper :custom_fields

  include_query_helpers

  def index
    redirect_to :issues
  end

  def issues
    retrieve_query

    respond_to do |format|
      format.html { render(layout: !request.xhr?) }
      format.api do
        load_projects
        load_issues
        load_versions
        load_relations

        build_dates @issues, :start_date, :due_date
      end
    end
  end

  def projects
    retrieve_query

    if Project.column_names.include?('easy_baseline_for_id')
      @with_baselines = true
    end

    load_projects
    build_dates @projects, :gantt_start_date, :gantt_due_date

    respond_to do |format|
      format.api
    end
  end

  def change_issue_relation_delay
    if !User.current.allowed_to?(:manage_issue_relations, @project)
      return render_403
    end

    @relation.update_column(:delay, params[:delay].to_i)

    respond_to do |format|
      format.api { render_api_ok }
    end
  end

  # You cannot use issue.reschedule_on because it will
  # also set start_date which is not desirable !!!
  def reschedule_project
    @project.gantt_reschedule(params[:days].to_i)

    respond_to do |format|
      format.api { render_api_ok }
    end
  end

  private

    def check_rest_api_enabled
      if Setting.rest_api_enabled != '1'
        render_error message: l('easy_gantt.errors.no_rest_api')
        return false
      end
    end

    def find_relation
      @relation = IssueRelation.find(params[:id])
    rescue ActiveRecord::RecordNotFound
      render_404
    end

    def query_class
      easy_extensions? ? EasyGanttEasyIssueQuery : EasyGantt::EasyGanttIssueQuery
    end

    def retrieve_query
      if params[:query_id].present?
        cond  = 'project_id IS NULL'
        cond << " OR project_id = #{@project.id}" if @project

        @query = query_class.where(cond).find_by_id(params[:query_id])
        raise ActiveRecord::RecordNotFound if @query.nil?
        raise Unauthorized unless @query.visible?

        @query.project = @project
        sort_clear
      else
        @query = query_class.new(name: '_')
        @query.project = @project
        @query.from_params(params)
      end

      if @opened_project
        @query.opened_project = @opened_project
      end
    end

    # Load version from loaded task and from opened projects
    # TO_CONSIDER: Send versions if there is no tasks?
    def load_versions
      version_ids = @issues.map(&:fixed_version_id).uniq.compact
      @versions = Version.open.where("id IN (?) OR project_id = ?", version_ids, @opened_project.id).sorted
    end

    # Load subproject of opened project which contains filtered tasks
    #
    # Project 1
    # |-- Project 1.1
    # |   `-- Project 1.1.1
    # |       |-- Task 1
    # |       `-- Task 2
    # `-- Project 1.2
    #
    # If Project 1 is opened, Project 1.1 must be send even if there is no task
    #
    # TO_CONSIDER: Send full tree and load only opened_project's issues
    #
    def load_projects
      p_table = Project.table_name

      @projects = []

      # Project gantt is opened, normally only subprojects will be sent
      # but there is not any root project yet
      if @project && @opened_project == @project
        @projects << @project
      end

      projects = @query.without_opened_project { |q|
          scope = q.create_entity_scope

          # Not necessary, will take only subprojects
          if @opened_project
            scope = scope.where("#{p_table}.lft >= ? AND #{p_table}.rgt <= ?", @opened_project.lft, @opened_project.rgt)
          end

          scope.distinct.pluck("#{p_table}.lft, #{p_table}.rgt")
        }

      if projects.blank?
        return
      end

      # All ancestors conditions
      tree_conditions = []
      projects.each do |lft, rgt|
        tree_conditions << "(lft <= #{lft} AND rgt >= #{rgt})"
      end
      tree_conditions = tree_conditions.join(' OR ')

      # From ancestors take only current opened level
      @projects.concat Project.where(tree_conditions).where(parent_id: @opened_project.try(:id)).to_a
    end

    def load_relations
      @relations = IssueRelation.where(issue_from_id: @issue_ids, issue_to_id: @issue_ids)
    end

    def load_issues
      @issues = @query.entities(
          includes: [:project, :status, :assigned_to, :fixed_version, :tracker, :priority, :custom_values],
          preload: [:project, :author, :assigned_to, :relations_from, :relations_to],
          order: "#{Issue.table_name}.start_date"
        ).to_a

      @issue_ids = @issues.map(&:id)
    end

    def build_dates(data, starts, ends)
      starts = data.map(&starts).compact
      ends = data.map(&ends).compact

      @start_date = (starts.min || ends.min || Date.today) - 1.day
      @end_date = (ends.max || starts.max || Date.today) + 1.day
    end

    def find_optional_project
      # Easy query workaround
      if params[:set_filter] == '1' && params[:project_id] && params[:project_id].match(/\A(=|\!|\!\*|\*)\S*/)
        return
      end

      super
    end

    def find_optional_opened_project
      if params[:opened_project_id].present?
        @opened_project = Project.find(params[:opened_project_id])
      else
        @opened_project = @project
      end
    rescue ActiveRecord::RecordNotFound
      render_404
    end

end
