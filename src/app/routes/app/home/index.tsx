import EditorLayout from '@/components/layouts/editor';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from '@/components/ui/link';
import { paths } from '@/config/paths';

const HomeRoute = () => {
  return (
    <EditorLayout>
      <div className="flex flex-col w-full gap-2 p-10">
        {/* Top cards section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Game Master Card */}
          <Card className="overflow-hidden">
            <div className="h-40 bg-linear-to-br from-purple-600 via-pink-500 to-orange-400"></div>
            <CardContent className="p-4 bg-white">
              <h3 className="text-xl font-medium text-center">Game Master</h3>
            </CardContent>
          </Card>

          {/* State View Card */}
          <Card className="overflow-hidden">
            <Link to={paths.views.stateView.path}>
              <div className="h-40 bg-linear-to-br from-purple-600 via-pink-500 to-orange-400"></div>
              <CardContent className="p-4 bg-white hover:bg-accent hover:text-white">
                <h3 className="text-xl font-medium text-center">State View</h3>
              </CardContent>
            </Link>
          </Card>

          {/* KPI Card */}
          <Card className="overflow-hidden">
            <div className="h-40 bg-linear-to-br from-purple-600 via-pink-500 to-orange-400"></div>
            <CardContent className="p-4 bg-white">
              <h3 className="text-xl font-medium text-center">KPI</h3>
            </CardContent>
          </Card>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gray-200"></div>

        {/* Status Section */}
        <Card className="w-full">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-medium mb-6">Status :</h2>
            <div className="space-y-4 pl-6">
              <div className="flex items-center gap-3">
                <span className="text-lg">- connected</span>
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg">- iidm loaded</span>
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </EditorLayout>
  );
};

export default HomeRoute;
