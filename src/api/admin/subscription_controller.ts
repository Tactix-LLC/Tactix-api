import { RequestHandler } from "express";
import axios from "axios";
import ClientModel from "../client/model";
import configs from "../../configs";

// Get all subscriptions with statistics
export const getAllSubscriptions: RequestHandler = async (req, res, next) => {
  try {
    const { status, plan, search, page = 1, limit = 20 } = req.query;

    // Build query
    const query: any = {};
    
    // Filter by subscription status
    if (status) {
      query.subscription_status = status;
    }
    
    // Filter by subscription plan
    if (plan) {
      query.subscription_plan = plan;
    }
    
    // Search by name or email
    if (search) {
      query.$or = [
        { first_name: { $regex: search, $options: 'i' } },
        { last_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get subscriptions
    const subscriptions = await ClientModel.find(query)
      .select('first_name last_name email phone_number subscription_status subscription_plan subscription_expires_at createdAt')
      .sort({ subscription_expires_at: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(); // Use lean() to get plain JavaScript objects

    // Transform data to include full_name
    const transformedSubscriptions = subscriptions.map((sub: any) => ({
      ...sub,
      full_name: `${sub.first_name} ${sub.last_name}`,
    }));

    // Get total count
    const total = await ClientModel.countDocuments(query);

    // Get statistics
    const stats = await ClientModel.aggregate([
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeSubscriptions: {
            $sum: {
              $cond: [{ $eq: ['$subscription_status', 'active'] }, 1, 0]
            }
          },
          monthlySubscriptions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$subscription_status', 'active'] },
                    { $eq: ['$subscription_plan', 'monthly'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          yearlySubscriptions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$subscription_status', 'active'] },
                    { $eq: ['$subscription_plan', 'yearly'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          expiredSubscriptions: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$subscription_expires_at', null] },
                    { $lt: ['$subscription_expires_at', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    console.log('📊 Subscription Statistics:', stats);

    const statistics = stats[0] || {
      totalUsers: 0,
      activeSubscriptions: 0,
      monthlySubscriptions: 0,
      yearlySubscriptions: 0,
      expiredSubscriptions: 0
    };

    console.log('📈 Final Statistics:', statistics);

    // Calculate revenue estimates (approximate)
    const monthlyRevenue = statistics.monthlySubscriptions * 4.99;
    const yearlyRevenue = statistics.yearlySubscriptions * 19.99;
    const totalMonthlyRecurringRevenue = monthlyRevenue + (yearlyRevenue / 12);

    // Respond
    res.status(200).json({
      status: "SUCCESS",
      data: {
        subscriptions: transformedSubscriptions,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        },
        statistics: {
          ...statistics,
          revenue: {
            monthly: monthlyRevenue.toFixed(2),
            yearly: yearlyRevenue.toFixed(2),
            mrr: totalMonthlyRecurringRevenue.toFixed(2)
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription details for a specific user
export const getUserSubscription: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await ClientModel.findById(userId)
      .select('first_name last_name email phone_number subscription_status subscription_plan subscription_expires_at createdAt')
      .lean();

    if (!user) {
      return res.status(404).json({
        status: "FAIL",
        message: "User not found"
      });
    }

    // Transform to include full_name
    const transformedUser = {
      ...user,
      full_name: `${user.first_name} ${user.last_name}`,
    };

    res.status(200).json({
      status: "SUCCESS",
      data: {
        user: transformedUser
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get subscription analytics
export const getSubscriptionAnalytics: RequestHandler = async (req, res, next) => {
  try {
    // Get subscriptions over time (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const subscriptionTrends = await ClientModel.aggregate([
      {
        $match: {
          subscription_status: 'active',
          createdAt: { $gte: twelveMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          monthly: {
            $sum: {
              $cond: [{ $eq: ['$subscription_plan', 'monthly'] }, 1, 0]
            }
          },
          yearly: {
            $sum: {
              $cond: [{ $eq: ['$subscription_plan', 'yearly'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Get churn data (subscriptions expiring soon)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const expiringSubscriptions = await ClientModel.find({
      subscription_status: 'active',
      subscription_expires_at: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    })
      .select('first_name last_name email subscription_plan subscription_expires_at')
      .lean();

    // Transform to include full_name
    const transformedExpiring = expiringSubscriptions.map((sub: any) => ({
      ...sub,
      full_name: `${sub.first_name} ${sub.last_name}`,
    }));

    res.status(200).json({
      status: "SUCCESS",
      data: {
        trends: subscriptionTrends,
        expiringSubscriptions: {
          count: transformedExpiring.length,
          users: transformedExpiring
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Expire/Cancel subscription for a user
export const expireSubscription: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Find user
    const user = await ClientModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "FAIL",
        message: "User not found"
      });
    }

    // Update subscription to inactive
    await ClientModel.findByIdAndUpdate(
      userId,
      {
        subscription_status: "inactive",
        subscription_plan: null,
        subscription_expires_at: null,
      },
      { runValidators: true, new: true }
    );

    console.log(`✅ Subscription expired/cancelled for user ${userId} by admin`);

    res.status(200).json({
      status: "SUCCESS",
      message: "Subscription expired successfully",
      data: {
        userId,
        subscription_status: "inactive"
      }
    });
  } catch (error) {
    next(error);
  }
};

// Sync subscription from RevenueCat
export const syncSubscriptionFromRevenueCat: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const revenueCatApiKey = configs.revenuecat.apiKey;

    if (!revenueCatApiKey) {
      return res.status(500).json({
        status: "FAIL",
        message: "RevenueCat API key not configured"
      });
    }

    // Find user
    const user = await ClientModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "FAIL",
        message: "User not found"
      });
    }

    // Fetch customer info from RevenueCat
    // RevenueCat uses app_user_id which should be the MongoDB user ID
    const revenueCatUrl = `https://api.revenuecat.com/v1/subscribers/${userId}`;
    
    console.log(`🔄 Syncing subscription from RevenueCat for user ${userId}`);

    let customerInfo;
    try {
      const response = await axios.get(revenueCatUrl, {
        headers: {
          'Authorization': `Bearer ${revenueCatApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      customerInfo = response.data.subscriber;
      console.log(`✅ Fetched customer info from RevenueCat for user ${userId}`);
    } catch (error: any) {
      console.error(`❌ Error fetching from RevenueCat:`, error.response?.data || error.message);
      
      // If user not found in RevenueCat, set subscription to inactive
      if (error.response?.status === 404) {
        await ClientModel.findByIdAndUpdate(
          userId,
          {
            subscription_status: "inactive",
            subscription_plan: null,
            subscription_expires_at: null,
          },
          { runValidators: true, new: true }
        );

        return res.status(200).json({
          status: "SUCCESS",
          message: "User not found in RevenueCat. Subscription set to inactive.",
          data: {
            userId,
            subscription_status: "inactive",
            synced: true
          }
        });
      }

      return res.status(500).json({
        status: "FAIL",
        message: `Failed to fetch from RevenueCat: ${error.response?.data?.message || error.message}`
      });
    }

    // Check for active entitlements
    const entitlements = customerInfo.entitlements || {};
    const activeEntitlements = Object.keys(entitlements).filter(
      key => entitlements[key]?.is_active === true
    );

    if (activeEntitlements.length === 0) {
      // No active subscription
      await ClientModel.findByIdAndUpdate(
        userId,
        {
          subscription_status: "inactive",
          subscription_plan: null,
          subscription_expires_at: null,
        },
        { runValidators: true, new: true }
      );

      return res.status(200).json({
        status: "SUCCESS",
        message: "No active subscription found. Subscription set to inactive.",
        data: {
          userId,
          subscription_status: "inactive",
          synced: true
        }
      });
    }

    // Get the first active entitlement (assuming "premium" or similar)
    const activeEntitlement = entitlements[activeEntitlements[0]];
    const productIdentifier = activeEntitlement.product_identifier || "";
    
    // Determine plan from product ID
    let plan = "monthly";
    if (productIdentifier.includes("yearly") || productIdentifier.includes("annual")) {
      plan = "yearly";
    }

    // Get expiration date
    let expiresAt: Date | null = null;
    if (activeEntitlement.expires_date) {
      expiresAt = new Date(activeEntitlement.expires_date);
    } else if (activeEntitlement.expiration_at_ms) {
      expiresAt = new Date(activeEntitlement.expiration_at_ms);
    }

    // Update subscription in database
    await ClientModel.findByIdAndUpdate(
      userId,
      {
        subscription_status: "active",
        subscription_plan: plan,
        subscription_expires_at: expiresAt,
      },
      { runValidators: true, new: true }
    );

    console.log(`✅ Subscription synced for user ${userId}: ${plan} until ${expiresAt?.toISOString() || 'unknown'}`);

    res.status(200).json({
      status: "SUCCESS",
      message: "Subscription synced successfully",
      data: {
        userId,
        subscription_status: "active",
        subscription_plan: plan,
        subscription_expires_at: expiresAt?.toISOString(),
        synced: true
      }
    });
  } catch (error) {
    console.error("Error syncing subscription:", error);
    next(error);
  }
};

export default {
  getAllSubscriptions,
  getUserSubscription,
  getSubscriptionAnalytics,
  expireSubscription,
  syncSubscriptionFromRevenueCat
};
