import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Heart, Shield, Target, Eye, Users, Lightbulb, Phone, Mail, Globe } from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "À propos · SenAlert";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
      <div className="bg-white shadow-sm p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">À propos de SenAlert</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 rounded-3xl p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-4">SenAlert</h2>
          <p className="text-xl mb-8 opacity-90">
            Plateforme citoyenne pour le Sénégal
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              <span>Citoyenneté active</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>Sécurité garantie</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <span>Impact réel</span>
            </div>
          </div>
        </div>

        {/* Mission and Vision */}
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Notre Mission</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                SenAlert est conçu pour permettre à toute la population du Sénégal de signaler 
                facilement les incidents et problèmes rencontrés dans leur environnement quotidien.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Notre objectif est de renforcer la participation citoyenne et d'améliorer la qualité 
                de vie de tous, partout au Sénégal, en créant un pont direct entre les citoyens et 
                les services publics.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Notre Vision</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed mb-4">
                Nous aspirons à créer un Sénégal où chaque citoyen peut contribuer activement 
                à l'amélioration de son cadre de vie.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Une société où la technologie facilite la communication entre les habitants et 
                les autorités, pour un développement durable et inclusif.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Values */}
        <div>
          <h3 className="text-2xl font-bold text-center mb-8">Nos Valeurs</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="text-center bg-blue-50 border-blue-200">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Communauté</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Une plateforme participative pour tous les citoyens sénégalais, 
                  favorisant l'engagement collectif
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-green-50 border-green-200">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-lg">Transparence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Signalement sécurisé et traitement transparent pour une confiance mutuelle
                </p>
              </CardContent>
            </Card>

            <Card className="text-center bg-orange-50 border-orange-200">
              <CardHeader>
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lightbulb className="h-8 w-8 text-orange-600" />
                </div>
                <CardTitle className="text-lg">Innovation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm leading-relaxed">
                  Utilisation des technologies modernes pour un service public plus efficace
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Impact */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-green-500 rounded-3xl p-8 text-white">
          <h3 className="text-2xl font-bold text-center mb-8">Impact de SenAlert</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-sm opacity-90">Couverture nationale</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-sm opacity-90">Disponibilité</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">Rapide</div>
              <div className="text-sm opacity-90">Traitement</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">Sécurisé</div>
              <div className="text-sm opacity-90">Données protégées</div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-2xl font-bold text-center mb-8">Contact et Support</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">Téléphone</h4>
                <p className="text-sm text-gray-600">+221 78 328 55 88</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">Email</h4>
                <p className="text-sm text-gray-600">digitalmsolution2025@gmail.com</p>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Globe className="h-6 w-6 text-orange-600" />
                </div>
                <h4 className="font-semibold mb-2">Site web</h4>
                <p className="text-sm text-gray-600">www.senalert.sn</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold mb-4">Prêt à contribuer ?</h3>
          <p className="text-lg mb-6 opacity-90">
            Rejoignez la communauté SenAlert et participez à l'amélioration de votre environnement
          </p>
          <Button 
            onClick={() => navigate('/signaler')}
            className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
          >
            Faire un signalement
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center py-8 border-t">
          <p className="text-gray-600 text-sm">
            Cette plateforme est développée pour la population du Sénégal.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Version 1.0 - © 2024 SenAlert - Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;