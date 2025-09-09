import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface ExperimentResultsQuery {
  experimentName?: string;
  dateFrom?: string;
  dateTo?: string;
  includeAll?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      experimentName, 
      dateFrom, 
      dateTo, 
      includeAll = false 
    } = req.query as ExperimentResultsQuery;

    // Verify admin access (simplified - in production, verify JWT token)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // If specific experiment requested
    if (experimentName) {
      const results = await getExperimentResults(experimentName, dateFrom, dateTo);
      return res.status(200).json(results);
    }

    // Get all experiments overview
    const experiments = await getAllExperiments(includeAll);
    res.status(200).json(experiments);

  } catch (error) {
    console.error('Experiment results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get detailed results for a specific experiment
async function getExperimentResults(experimentName: string, dateFrom?: string, dateTo?: string) {
  // Get experiment details
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .select('*')
    .eq('name', experimentName)
    .single();

  if (expError || !experiment) {
    throw new Error('Experiment not found');
  }

  // Build date filter
  const dateFilter = buildDateFilter(dateFrom, dateTo);

  // Get variant performance data
  const variantResults = await Promise.all(
    experiment.variants.map(async (variant: any) => {
      // Get total users in this variant
      const { count: totalUsers } = await supabase
        .from('user_experiment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('experiment_id', experiment.id)
        .eq('variant_id', variant.id);

      // Get conversion events for this variant
      let conversionQuery = supabase
        .from('experiment_events')
        .select('*', { count: 'exact', head: false })
        .eq('experiment_id', experiment.id)
        .eq('variant_id', variant.id)
        .like('event_name', 'conversion_%');

      if (dateFilter.start) {
        conversionQuery = conversionQuery.gte('timestamp', dateFilter.start);
      }
      if (dateFilter.end) {
        conversionQuery = conversionQuery.lte('timestamp', dateFilter.end);
      }

      const { data: conversions, count: conversionCount } = await conversionQuery;

      // Calculate conversion rate
      const conversionRate = totalUsers ? (conversionCount || 0) / totalUsers : 0;

      // Calculate confidence interval using Wilson score interval
      const confidenceInterval = calculateConfidenceInterval(
        conversionCount || 0, 
        totalUsers || 0, 
        experiment.confidence_level
      );

      // Get additional metrics
      const metrics = await getVariantMetrics(experiment.id, variant.id, dateFilter);

      return {
        variant_id: variant.id,
        variant_name: variant.name,
        allocation: variant.allocation,
        total_users: totalUsers || 0,
        conversions: conversionCount || 0,
        conversion_rate: conversionRate,
        confidence_interval: confidenceInterval,
        metrics: metrics,
        is_control: variant.id === experiment.control_variant_id,
        is_winning: false, // Will be determined later
      };
    })
  );

  // Determine statistical significance and winning variant
  const resultsWithSignificance = calculateStatisticalSignificance(variantResults, experiment);

  // Get funnel analysis
  const funnelAnalysis = await getFunnelAnalysis(experiment.id, dateFilter);

  // Get cohort analysis
  const cohortAnalysis = await getCohortAnalysis(experiment.id, dateFilter);

  return {
    experiment: {
      id: experiment.id,
      name: experiment.name,
      description: experiment.description,
      status: experiment.status,
      primary_metric: experiment.primary_metric,
      start_date: experiment.start_date,
      end_date: experiment.end_date,
      confidence_level: experiment.confidence_level,
    },
    results: resultsWithSignificance,
    funnel_analysis: funnelAnalysis,
    cohort_analysis: cohortAnalysis,
    summary: {
      total_users: resultsWithSignificance.reduce((sum, r) => sum + r.total_users, 0),
      total_conversions: resultsWithSignificance.reduce((sum, r) => sum + r.conversions, 0),
      overall_conversion_rate: resultsWithSignificance.reduce((sum, r) => sum + (r.conversion_rate * r.total_users), 0) / 
                              resultsWithSignificance.reduce((sum, r) => sum + r.total_users, 0),
      has_winner: resultsWithSignificance.some(r => r.is_winning),
      statistical_power: calculateStatisticalPower(resultsWithSignificance),
    },
  };
}

// Get all experiments with basic metrics
async function getAllExperiments(includeAll: boolean) {
  let query = supabase
    .from('experiments')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeAll) {
    query = query.in('status', ['running', 'completed']);
  }

  const { data: experiments, error } = await query;
  
  if (error) throw error;

  // Get basic metrics for each experiment
  const experimentsWithMetrics = await Promise.all(
    experiments.map(async (experiment) => {
      // Get total participants
      const { count: totalParticipants } = await supabase
        .from('user_experiment_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('experiment_id', experiment.id);

      // Get total events
      const { count: totalEvents } = await supabase
        .from('experiment_events')
        .select('*', { count: 'exact', head: true })
        .eq('experiment_id', experiment.id);

      // Get conversion count
      const { count: conversions } = await supabase
        .from('experiment_events')
        .select('*', { count: 'exact', head: true })
        .eq('experiment_id', experiment.id)
        .like('event_name', 'conversion_%');

      const conversionRate = totalParticipants ? (conversions || 0) / totalParticipants : 0;

      return {
        id: experiment.id,
        name: experiment.name,
        description: experiment.description,
        status: experiment.status,
        primary_metric: experiment.primary_metric,
        start_date: experiment.start_date,
        end_date: experiment.end_date,
        variants_count: experiment.variants.length,
        traffic_allocation: experiment.traffic_allocation,
        total_participants: totalParticipants || 0,
        total_events: totalEvents || 0,
        conversions: conversions || 0,
        conversion_rate: conversionRate,
        created_at: experiment.created_at,
        updated_at: experiment.updated_at,
      };
    })
  );

  return {
    experiments: experimentsWithMetrics,
    total_count: experiments.length,
    active_count: experiments.filter(e => e.status === 'running').length,
    completed_count: experiments.filter(e => e.status === 'completed').length,
  };
}

// Get additional metrics for a variant
async function getVariantMetrics(experimentId: string, variantId: string, dateFilter: any) {
  const baseQuery = {
    experiment_id: experimentId,
    variant_id: variantId,
  };

  // Revenue metrics
  const { data: revenueEvents } = await supabase
    .from('experiment_events')
    .select('value')
    .match(baseQuery)
    .eq('event_name', 'conversion_purchase')
    .gte('timestamp', dateFilter.start || '2020-01-01')
    .lte('timestamp', dateFilter.end || '2030-01-01');

  const totalRevenue = revenueEvents?.reduce((sum, event) => sum + (event.value || 0), 0) || 0;

  // Engagement metrics
  const { count: pageViews } = await supabase
    .from('experiment_events')
    .select('*', { count: 'exact', head: true })
    .match(baseQuery)
    .eq('event_name', 'page_viewed')
    .gte('timestamp', dateFilter.start || '2020-01-01')
    .lte('timestamp', dateFilter.end || '2030-01-01');

  // Time-based metrics
  const { data: sessionEvents } = await supabase
    .from('experiment_events')
    .select('event_properties')
    .match(baseQuery)
    .eq('event_name', 'session_ended')
    .gte('timestamp', dateFilter.start || '2020-01-01')
    .lte('timestamp', dateFilter.end || '2030-01-01');

  const avgSessionDuration = sessionEvents?.length ? 
    sessionEvents.reduce((sum, event) => sum + (event.event_properties?.duration_seconds || 0), 0) / sessionEvents.length :
    0;

  return {
    total_revenue: totalRevenue,
    average_revenue_per_user: totalRevenue / Math.max(1, revenueEvents?.length || 1),
    page_views: pageViews || 0,
    average_session_duration: avgSessionDuration,
  };
}

// Calculate confidence interval using Wilson score interval
function calculateConfidenceInterval(conversions: number, total: number, confidenceLevel: number) {
  if (total === 0) return [0, 0];

  const z = getZScore(confidenceLevel);
  const p = conversions / total;
  const n = total;

  const denominator = 1 + (z * z) / n;
  const centre = (p + (z * z) / (2 * n)) / denominator;
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n) / denominator;

  return [
    Math.max(0, centre - margin),
    Math.min(1, centre + margin)
  ];
}

// Get Z-score for confidence level
function getZScore(confidenceLevel: number): number {
  const zScores: { [key: number]: number } = {
    0.90: 1.645,
    0.95: 1.96,
    0.99: 2.576,
  };
  
  return zScores[confidenceLevel] || 1.96;
}

// Calculate statistical significance between variants
function calculateStatisticalSignificance(variantResults: any[], experiment: any) {
  if (variantResults.length < 2) return variantResults;

  const controlVariant = variantResults.find(v => v.is_control);
  if (!controlVariant) return variantResults;

  let bestVariant = controlVariant;
  let hasStatisticalSignificance = false;

  // Compare each variant against control
  const resultsWithSignificance = variantResults.map(variant => {
    if (variant.is_control) {
      return { ...variant, statistical_significance: 0 };
    }

    // Calculate statistical significance using two-proportion z-test
    const significance = calculateTwoProportionZTest(
      variant.conversions,
      variant.total_users,
      controlVariant.conversions,
      controlVariant.total_users,
      experiment.confidence_level
    );

    // Update best variant if this one is significantly better
    if (significance.is_significant && variant.conversion_rate > bestVariant.conversion_rate) {
      bestVariant = variant;
      hasStatisticalSignificance = true;
    }

    return {
      ...variant,
      statistical_significance: significance.p_value,
      is_significant: significance.is_significant,
    };
  });

  // Mark the winning variant
  if (hasStatisticalSignificance) {
    const winnerIndex = resultsWithSignificance.findIndex(v => v.variant_id === bestVariant.variant_id);
    if (winnerIndex !== -1) {
      resultsWithSignificance[winnerIndex].is_winning = true;
    }
  }

  return resultsWithSignificance;
}

// Two-proportion z-test for statistical significance
function calculateTwoProportionZTest(
  x1: number, n1: number,  // variant conversions, total
  x2: number, n2: number,  // control conversions, total
  confidenceLevel: number
) {
  if (n1 === 0 || n2 === 0) {
    return { p_value: 1, is_significant: false, z_score: 0 };
  }

  const p1 = x1 / n1;
  const p2 = x2 / n2;
  const p_pooled = (x1 + x2) / (n1 + n2);
  
  const se = Math.sqrt(p_pooled * (1 - p_pooled) * (1/n1 + 1/n2));
  const z_score = se !== 0 ? (p1 - p2) / se : 0;
  
  // Two-tailed test p-value
  const p_value = 2 * (1 - normalCDF(Math.abs(z_score)));
  const is_significant = p_value < (1 - confidenceLevel);
  
  return { p_value, is_significant, z_score };
}

// Approximate normal CDF
function normalCDF(x: number): number {
  return (1.0 + erf(x / Math.sqrt(2.0))) / 2.0;
}

// Error function approximation
function erf(x: number): number {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Calculate statistical power
function calculateStatisticalPower(variantResults: any[]): number {
  // Simplified statistical power calculation
  // In practice, you'd use more sophisticated methods
  const totalUsers = variantResults.reduce((sum, r) => sum + r.total_users, 0);
  const minSampleSize = 1000; // From experiment configuration
  
  return Math.min(1, totalUsers / (minSampleSize * variantResults.length));
}

// Build date filter object
function buildDateFilter(dateFrom?: string, dateTo?: string) {
  const filter: any = {};
  
  if (dateFrom) {
    filter.start = dateFrom;
  }
  
  if (dateTo) {
    filter.end = dateTo;
  }
  
  return filter;
}

// Get funnel analysis for experiment
async function getFunnelAnalysis(experimentId: string, dateFilter: any) {
  // This would analyze conversion funnels for the experiment
  // Simplified implementation
  return {
    steps: [],
    completion_rates: {},
    drop_off_points: [],
  };
}

// Get cohort analysis for experiment
async function getCohortAnalysis(experimentId: string, dateFilter: any) {
  // This would analyze user retention by cohort
  // Simplified implementation
  return {
    cohorts: [],
    retention_rates: {},
    lifetime_value: {},
  };
}