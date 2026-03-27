import React from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, ShoppingBag, Coins, Package } from 'lucide-react-native';
import { useApp } from '@/contexts/AppContext';
import { trpc } from '@/lib/trpc';
import { Logo } from '@/components/Logo';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

type BonusType = 'DOUBLE_POINTS' | 'GOAL_DIFF_MULTIPLIER' | 'PLUS_1H';

export default function ShopScreen() {
  const { theme, t, selectedTournamentId } = useApp();
  const utils = trpc.useUtils();

  const shopQuery = trpc.shop.getStatus.useQuery(
    { tournamentId: selectedTournamentId || '' },
    { enabled: !!selectedTournamentId }
  );

  const purchaseMutation = trpc.shop.purchase.useMutation({
    onSuccess: () => {
      utils.shop.getStatus.invalidate({ tournamentId: selectedTournamentId || '' });
      utils.bonus.getInventory.invalidate({ tournamentId: selectedTournamentId || '' });
      Alert.alert(t.common.success, t.shop.purchaseSuccess);
    },
    onError: (err) => Alert.alert(t.common.error, err.message),
  });

  const shopData = shopQuery.data;

  const handlePurchase = (bonusType: BonusType) => {
    if (!selectedTournamentId) return;
    purchaseMutation.mutate({ tournamentId: selectedTournamentId, bonusType });
  };

  const getBonusInfo = (type: BonusType) => {
    switch (type) {
      case 'DOUBLE_POINTS':
        return { name: t.bonus.DOUBLE_POINTS, desc: t.bonus.doubleDescription, icon: '×2' };
      case 'GOAL_DIFF_MULTIPLIER':
        return { name: t.bonus.GOAL_DIFF_MULTIPLIER, desc: t.bonus.goalDiffDescription, icon: '±' };
      case 'PLUS_1H':
        return { name: t.bonus.PLUS_1H, desc: t.bonus.plus1hDescription, icon: '+1h' };
    }
  };

  const getInventoryQuantity = (type: BonusType) => {
    return shopData?.inventory.find(i => i.bonusType === type)?.quantity || 0;
  };

  const purchasesRemaining = (shopData?.maxPurchases || 5) - (shopData?.purchaseCount || 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Logo size="small" />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={shopQuery.isRefetching}
            onRefresh={() => shopQuery.refetch()}
            tintColor={theme.primary}
          />
        }
      >
        <Text style={[styles.title, { color: theme.text }]}>{t.shop.title}</Text>

        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.primary + '20' }]}>
              <Coins size={24} color={theme.primary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {shopData?.currentPoints || 0}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              {t.shop.currentPoints}
            </Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: theme.secondary + '20' }]}>
              <Package size={24} color={theme.secondary} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>
              {purchasesRemaining}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textMuted }]}>
              {t.shop.purchasesRemaining}
            </Text>
          </Card>
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text }]}>{t.bonus.inventory}</Text>

        <View style={styles.inventoryRow}>
          {(['DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H'] as BonusType[]).map(type => {
            const info = getBonusInfo(type);
            const qty = getInventoryQuantity(type);
            return (
              <View
                key={type}
                style={[styles.inventoryItem, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <View style={[styles.inventoryIcon, { backgroundColor: theme.accent + '20' }]}>
                  <Text style={[styles.inventoryIconText, { color: theme.accent }]}>{info.icon}</Text>
                </View>
                <Text style={[styles.inventoryQty, { color: theme.text }]}>{qty}</Text>
                <Text style={[styles.inventoryName, { color: theme.textSecondary }]} numberOfLines={1}>
                  {info.name}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: theme.text, marginTop: 24 }]}>
          <ShoppingBag size={18} color={theme.text} /> {t.shop.title}
        </Text>

        {(['DOUBLE_POINTS', 'GOAL_DIFF_MULTIPLIER', 'PLUS_1H'] as BonusType[]).map(type => {
          const info = getBonusInfo(type);
          const canBuy = shopData?.canPurchase && (shopData?.currentPoints || 0) >= (shopData?.bonusCost || 3);
          
          return (
            <Card key={type} style={styles.shopItem}>
              <View style={[styles.shopItemIcon, { backgroundColor: theme.accent + '20' }]}>
                <Zap size={28} color={theme.accent} />
              </View>
              <View style={styles.shopItemInfo}>
                <Text style={[styles.shopItemName, { color: theme.text }]}>{info.name}</Text>
                <Text style={[styles.shopItemDesc, { color: theme.textSecondary }]}>{info.desc}</Text>
                <View style={styles.priceRow}>
                  <Badge label={`${shopData?.bonusCost || 3} ${t.common.pts}`} variant="primary" />
                </View>
              </View>
              <Button
                title={t.shop.buy}
                onPress={() => handlePurchase(type)}
                disabled={!canBuy}
                loading={purchaseMutation.isPending}
                size="small"
              />
            </Card>
          );
        })}

        {!shopData?.canPurchase && (
          <View style={[styles.warningBox, { backgroundColor: theme.warning + '20' }]}>
            <Text style={[styles.warningText, { color: theme.warning }]}>
              {(shopData?.currentPoints || 0) < (shopData?.bonusCost || 3)
                ? t.shop.insufficientPoints
                : t.shop.limitReached}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  inventoryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inventoryItem: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  inventoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  inventoryIconText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  inventoryQty: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  inventoryName: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  shopItemIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopItemInfo: {
    flex: 1,
    marginLeft: 14,
  },
  shopItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  shopItemDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  priceRow: {
    marginTop: 6,
  },
  warningBox: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  warningText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
